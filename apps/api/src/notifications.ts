import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { Expo } from "expo-server-sdk";
import { DateTime, Interval } from "luxon";
import { prisma } from "./prisma.js";
import { EventType, NotificationType } from "@prisma/client";

const expo = new Expo();

async function getBabyMembersPushTokens(babyId: string): Promise<string[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      babyId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { userId: true, role: true },
  });

  const userIds = memberships.map((m) => m.userId);
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
  return tokens.map((t) => t.token).filter(Expo.isExpoPushToken);
}

async function sendPush(tokens: string[], title: string, body: string) {
  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to,
    sound: undefined,
    title,
    body,
    data: { kind: "goal" },
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch {
      // best-effort for MVP
    }
  }
}

export function startNotificationScheduler(app: FastifyInstance) {
  // Every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    const babies = await prisma.baby.findMany({
      include: { goal: true },
    });

    for (const baby of babies) {
      const goal = baby.goal;
      if (!goal) continue;

      const dailyOzGoal = goal.dailyOzGoal ?? 0;
      const dailySleepHoursGoal = goal.dailySleepHoursGoal ?? 0;
      if (dailyOzGoal <= 0 && dailySleepHoursGoal <= 0) continue;

      const nowLocal = DateTime.now().setZone(baby.timezone);
      // send reminders only after 20:00 local time
      if (nowLocal.hour < 20) continue;

      const dayStart = nowLocal.startOf("day");
      const dayEnd = nowLocal.endOf("day");
      const dayKey = dayStart.toUTC().toJSDate();

      const [feedingAgg, sleepEvents] = await Promise.all([
        prisma.event.aggregate({
          where: {
            babyId: baby.id,
            type: EventType.FEEDING,
            occurredAt: { gte: dayStart.toUTC().toJSDate(), lte: dayEnd.toUTC().toJSDate() },
          },
          _sum: { amountOz: true },
        }),
        prisma.event.findMany({
          where: {
            babyId: baby.id,
            type: EventType.SLEEP,
            startAt: { not: null },
            endAt: { not: null },
            // overlap with today (in local day converted to UTC)
            OR: [
              { startAt: { gte: dayStart.toUTC().toJSDate(), lte: dayEnd.toUTC().toJSDate() } },
              { endAt: { gte: dayStart.toUTC().toJSDate(), lte: dayEnd.toUTC().toJSDate() } },
              { startAt: { lte: dayStart.toUTC().toJSDate() }, endAt: { gte: dayEnd.toUTC().toJSDate() } },
            ],
          },
          select: { startAt: true, endAt: true },
        }),
      ]);

      const ounces = feedingAgg._sum.amountOz ?? 0;

      const dayInterval = Interval.fromDateTimes(dayStart, dayEnd);
      const sleepMs = sleepEvents.reduce((acc, e) => {
        const s = DateTime.fromJSDate(e.startAt!).setZone(baby.timezone);
        const t = DateTime.fromJSDate(e.endAt!).setZone(baby.timezone);
        const inter = dayInterval.intersection(Interval.fromDateTimes(s, t));
        return acc + (inter ? inter.toDuration().as("milliseconds") : 0);
      }, 0);
      const sleepHours = sleepMs / 3600_000;

      const tokens = await getBabyMembersPushTokens(baby.id);

      if (dailyOzGoal > 0 && ounces < dailyOzGoal) {
        try {
          await prisma.notificationLog.create({
            data: { babyId: baby.id, type: NotificationType.DAILY_OZ_MISSED, day: dayKey },
          });
          await sendPush(tokens, "Meta de comida", `Hoy van ${Math.round(ounces * 10) / 10} / ${dailyOzGoal} onzas.`);
        } catch (e: any) {
          // ignore unique constraint conflicts
          if (e?.code !== "P2002") app.log.warn({ err: e }, "notification error");
        }
      }

      if (dailySleepHoursGoal > 0 && sleepHours < dailySleepHoursGoal) {
        try {
          await prisma.notificationLog.create({
            data: { babyId: baby.id, type: NotificationType.DAILY_SLEEP_MISSED, day: dayKey },
          });
          await sendPush(
            tokens,
            "Meta de sueño",
            `Hoy van ${Math.round(sleepHours * 10) / 10} / ${dailySleepHoursGoal} horas de sueño.`
          );
        } catch (e: any) {
          if (e?.code !== "P2002") app.log.warn({ err: e }, "notification error");
        }
      }
    }
  });
}

