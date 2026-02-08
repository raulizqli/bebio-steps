import dayjs from "dayjs";

import { prisma } from "./prisma.js";

export type NotificationType = "SLEEP_GOAL_MISSED" | "OUNCES_GOAL_MISSED";

export type NotificationCheckResult = {
  childId: string;
  day: string;
  sent: Array<{ type: NotificationType; recipients: number }>;
  skipped: Array<{ type: NotificationType; reason: string }>;
  metrics: { ouncesTotal: number; sleepMinutesTotal: number };
};

function startOfDay(d: Date) {
  return dayjs(d).startOf("day").toDate();
}

function endOfDay(d: Date) {
  return dayjs(d).endOf("day").toDate();
}

export async function sendExpoPushNotifications(messages: Array<{ to: string; title: string; body: string }>) {
  if (messages.length === 0) return { ok: true, delivered: 0 };

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages.map((m) => ({ to: m.to, title: m.title, body: m.body }))),
  });
  if (!res.ok) throw new Error(`Expo push failed: ${res.status}`);
  return { ok: true, delivered: messages.length };
}

export async function runDailyGoalCheck(params: {
  childId: string;
  day?: Date;
  pushEnabled: boolean;
}): Promise<NotificationCheckResult> {
  const day = params.day ?? new Date();
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const child = await prisma.child.findUnique({
    where: { id: params.childId },
    include: { goalSettings: true, household: { include: { members: true } } },
  });
  if (!child) throw new Error("CHILD_NOT_FOUND");
  const ensuredChild = child;

  const goals = ensuredChild.goalSettings;
  const ouncesGoal = goals?.dailyOuncesGoal ?? null;
  const sleepGoalMinutes = goals?.dailySleepMinutesGoal ?? null;

  const feedings = await prisma.feeding.findMany({
    where: { childId: ensuredChild.id, startedAt: { gte: dayStart, lte: dayEnd } },
    select: { ounces: true },
  });
  const ouncesTotal = feedings.reduce((sum, f) => sum + (f.ounces ?? 0), 0);

  const sleeps = await prisma.sleep.findMany({
    where: { childId: ensuredChild.id, startedAt: { lte: dayEnd }, endedAt: { not: null } },
    select: { startedAt: true, endedAt: true },
  });

  const sleepMinutesTotal = sleeps.reduce((sum, s) => {
    const start = s.startedAt < dayStart ? dayStart : s.startedAt;
    const end = (s.endedAt as Date) > dayEnd ? dayEnd : (s.endedAt as Date);
    const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return sum + mins;
  }, 0);

  const activeMembers = ensuredChild.household.members.filter((m) => {
    if (m.revokedAt) return false;
    if (m.expiresAt && m.expiresAt.getTime() <= Date.now()) return false;
    return true;
  });
  const userIds = activeMembers.map((m) => m.userId);
  const tokens = await prisma.notificationToken.findMany({
    where: { userId: { in: userIds }, revokedAt: null },
    select: { expoPushToken: true, userId: true },
  });

  const sent: NotificationCheckResult["sent"] = [];
  const skipped: NotificationCheckResult["skipped"] = [];

  async function maybeSend(type: NotificationType, shouldSend: boolean, body: string) {
    if (!shouldSend) {
      skipped.push({ type, reason: "GOAL_MET_OR_NOT_SET" });
      return;
    }

    const existing = await prisma.notificationLog.findFirst({
      where: { childId: ensuredChild.id, day: dayStart, type },
    });
    if (existing) {
      skipped.push({ type, reason: "ALREADY_SENT" });
      return;
    }

    if (!params.pushEnabled) {
      await prisma.notificationLog.create({ data: { childId: ensuredChild.id, day: dayStart, type } });
      sent.push({ type, recipients: tokens.length });
      return;
    }

    const messages = tokens.map((t) => ({ to: t.expoPushToken, title: "Bebio", body }));
    await sendExpoPushNotifications(messages);
    await prisma.notificationLog.create({ data: { childId: ensuredChild.id, day: dayStart, type } });
    sent.push({ type, recipients: tokens.length });
  }

  await maybeSend(
    "OUNCES_GOAL_MISSED" satisfies NotificationType,
    ouncesGoal != null && ouncesTotal < ouncesGoal,
    `Meta de comida no cumplida: ${ouncesTotal.toFixed(0)}oz de ${ouncesGoal ?? 0}oz hoy.`,
  );
  await maybeSend(
    "SLEEP_GOAL_MISSED" satisfies NotificationType,
    sleepGoalMinutes != null && sleepMinutesTotal < sleepGoalMinutes,
    `Meta de sueño no cumplida: ${sleepMinutesTotal} min de ${sleepGoalMinutes ?? 0} min hoy.`,
  );

  return {
    childId: ensuredChild.id,
    day: dayStart.toISOString(),
    sent,
    skipped,
    metrics: { ouncesTotal, sleepMinutesTotal },
  };
}

