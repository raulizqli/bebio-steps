import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { randomBytes } from "node:crypto";

import { loadEnv } from "./env.js";
import { prisma } from "./prisma.js";
import { hashPassword, LoginSchema, RegisterSchema, signUserJwt, verifyPassword } from "./auth.js";
import { zodParse } from "./http.js";
import { requireActiveMembership, requireAuth } from "./middleware.js";
import { runDailyGoalCheck } from "./notifications.js";

const env = loadEnv();

const app = Fastify({ logger: true });

const MemberRoleEnum = z.enum(["PARENT_ADMIN", "PARENT", "CAREGIVER"]);
type MemberRole = z.infer<typeof MemberRoleEnum>;
const FeedingTypeEnum = z.enum(["BOTTLE", "BREAST", "FORMULA"]);
const MealTypeEnum = z.enum(["SOLIDS", "PUREE", "SNACK", "OTHER"]);
const MoodTypeEnum = z.enum(["HAPPY", "OK", "FUSSY", "SAD", "ANXIOUS", "SICK", "TIRED"]);

await app.register(cors, { origin: true });
await app.register(jwt, { secret: env.JWT_SECRET });

await app.register(swagger, {
  swagger: {
    info: { title: "Bebio API", version: "0.1.0" },
  },
});
await app.register(swaggerUi, { routePrefix: "/docs" });

app.setErrorHandler((err, _req, reply) => {
  if ((err as any)?.details) {
    return reply.code(400).send({ error: "VALIDATION_ERROR", details: (err as any).details });
  }
  if (err.message === "UNAUTHORIZED") {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }
  app.log.error(err);
  return reply.code(500).send({ error: "INTERNAL_ERROR" });
});

app.get("/health", async () => ({ ok: true }));

// Auth
app.post("/auth/register", async (req, reply) => {
  const body = zodParse(RegisterSchema, req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return reply.code(409).send({ error: "EMAIL_IN_USE" });

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash: await hashPassword(body.password),
      name: body.name,
    },
    select: { id: true, email: true, name: true },
  });
  const token = await signUserJwt(app, user);
  return reply.send({ token, user });
});

app.post("/auth/login", async (req, reply) => {
  const body = zodParse(LoginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
  const ok = await verifyPassword(user.passwordHash, body.password);
  if (!ok) return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
  const token = await signUserJwt(app, user);
  return reply.send({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get("/me", { preHandler: requireAuth }, async (req) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUserId! },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  const memberships = await prisma.householdMember.findMany({
    where: { userId: req.authUserId!, revokedAt: null },
    include: { household: true },
    orderBy: { createdAt: "desc" },
  });
  return { user, households: memberships.map((m) => ({ ...m.household, role: m.role, expiresAt: m.expiresAt })) };
});

// Push tokens (Expo)
app.post("/me/push-tokens", { preHandler: requireAuth }, async (req) => {
  const body = zodParse(
    z.object({
      platform: z.string().min(1),
      expoPushToken: z.string().min(10),
    }),
    req.body,
  );
  const token = await prisma.notificationToken.upsert({
    where: { expoPushToken: body.expoPushToken },
    create: { userId: req.authUserId!, platform: body.platform, expoPushToken: body.expoPushToken },
    update: { userId: req.authUserId!, platform: body.platform, revokedAt: null },
  });
  return { token };
});

// Run goal check (can be called by a scheduler/cron)
app.post("/notifications/run", { preHandler: requireAuth }, async (req, reply) => {
  const body = zodParse(z.object({ childId: z.string(), day: z.string().datetime().optional() }), req.body);
  const child = await prisma.child.findUnique({ where: { id: body.childId } });
  if (!child) return reply.code(404).send({ error: "CHILD_NOT_FOUND" });
  const membership = await requireActiveMembership(req, reply, child.householdId);
  if (!membership) return;
  if (membership.role !== "PARENT_ADMIN" && membership.role !== "PARENT") {
    return reply.code(403).send({ error: "FORBIDDEN" });
  }
  const result = await runDailyGoalCheck({ childId: body.childId, day: body.day ? new Date(body.day) : undefined, pushEnabled: !!env.EXPO_PUSH_ENABLED });
  return { result };
});

// Households
app.post("/households", { preHandler: requireAuth }, async (req) => {
  const body = zodParse(z.object({ name: z.string().min(1) }), req.body);
  const household = await prisma.household.create({
    data: {
      name: body.name,
      members: {
        create: {
          userId: req.authUserId!,
          role: "PARENT_ADMIN" satisfies MemberRole,
        },
      },
    },
  });
  return { household };
});

app.get("/households/:householdId/members", { preHandler: requireAuth }, async (req, reply) => {
  const params = zodParse(z.object({ householdId: z.string().min(1) }), req.params);
  const membership = await requireActiveMembership(req, reply, params.householdId);
  if (!membership) return;
  if (membership.role !== "PARENT_ADMIN") return reply.code(403).send({ error: "FORBIDDEN" });

  const members = await prisma.householdMember.findMany({
    where: { householdId: params.householdId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return { members };
});

app.patch(
  "/households/:householdId/members/:memberId/revoke",
  { preHandler: requireAuth },
  async (req, reply) => {
    const params = zodParse(z.object({ householdId: z.string(), memberId: z.string() }), req.params);
    const membership = await requireActiveMembership(req, reply, params.householdId);
    if (!membership) return;
    if (membership.role !== "PARENT_ADMIN") return reply.code(403).send({ error: "FORBIDDEN" });

    await prisma.householdMember.update({
      where: { id: params.memberId },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  },
);

// Children
app.post("/households/:householdId/children", { preHandler: requireAuth }, async (req, reply) => {
  const params = zodParse(z.object({ householdId: z.string() }), req.params);
  const body = zodParse(z.object({ name: z.string().min(1), birthDate: z.string().datetime().optional() }), req.body);
  const membership = await requireActiveMembership(req, reply, params.householdId);
  if (!membership) return;

  const child = await prisma.child.create({
    data: {
      householdId: params.householdId,
      name: body.name,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      goalSettings: { create: {} },
    },
  });
  return { child };
});

app.get("/households/:householdId/children", { preHandler: requireAuth }, async (req, reply) => {
  const params = zodParse(z.object({ householdId: z.string() }), req.params);
  const membership = await requireActiveMembership(req, reply, params.householdId);
  if (!membership) return;
  const children = await prisma.child.findMany({
    where: { householdId: params.householdId },
    include: { goalSettings: true },
    orderBy: { createdAt: "asc" },
  });
  return { children };
});

// Access grants (share code)
app.post("/households/:householdId/grants", { preHandler: requireAuth }, async (req, reply) => {
  const params = zodParse(z.object({ householdId: z.string() }), req.params);
  const body = zodParse(
    z.object({
      note: z.string().optional(),
      role: MemberRoleEnum.default("CAREGIVER"),
      expiresAt: z.string().datetime().optional(),
      maxUses: z.number().int().min(1).max(20).default(1),
      permissions: z.record(z.boolean()).optional(), // MemberPermissions-like
    }),
    req.body,
  );
  const membership = await requireActiveMembership(req, reply, params.householdId);
  if (!membership) return;
  if (membership.role !== "PARENT_ADMIN") return reply.code(403).send({ error: "FORBIDDEN" });

  const code = randomBytes(5).toString("hex"); // 10 chars
  const grant = await prisma.accessGrant.create({
    data: {
      householdId: params.householdId,
      createdByUserId: req.authUserId!,
      code,
      role: body.role,
      permissionsJson: body.permissions ? JSON.stringify(body.permissions) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      maxUses: body.maxUses,
      note: body.note,
    },
  });
  return { grant };
});

app.post("/grants/redeem", { preHandler: requireAuth }, async (req, reply) => {
  const body = zodParse(z.object({ code: z.string().min(6) }), req.body);
  const grant = await prisma.accessGrant.findUnique({ where: { code: body.code } });
  if (!grant) return reply.code(404).send({ error: "INVALID_CODE" });
  if (grant.revokedAt) return reply.code(410).send({ error: "CODE_REVOKED" });
  if (grant.expiresAt && grant.expiresAt.getTime() <= Date.now()) return reply.code(410).send({ error: "CODE_EXPIRED" });

  const uses = await prisma.grantRedemption.count({ where: { grantId: grant.id } });
  if (uses >= grant.maxUses) return reply.code(409).send({ error: "CODE_MAX_USES_REACHED" });

  const existing = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: grant.householdId, userId: req.authUserId! } },
  });
  if (existing && !existing.revokedAt) return reply.code(409).send({ error: "ALREADY_A_MEMBER" });

  await prisma.$transaction(async (tx) => {
    await tx.grantRedemption.create({
      data: { grantId: grant.id, redeemedByUserId: req.authUserId! },
    });

    await tx.householdMember.upsert({
      where: { householdId_userId: { householdId: grant.householdId, userId: req.authUserId! } },
      create: {
        householdId: grant.householdId,
        userId: req.authUserId!,
        role: grant.role,
        permissionsJson: grant.permissionsJson,
        expiresAt: grant.expiresAt,
      },
      update: {
        role: grant.role,
        permissionsJson: grant.permissionsJson,
        expiresAt: grant.expiresAt,
        revokedAt: null,
      },
    });
  });

  return { ok: true, householdId: grant.householdId };
});

app.patch("/households/:householdId/grants/:grantId/revoke", { preHandler: requireAuth }, async (req, reply) => {
  const params = zodParse(z.object({ householdId: z.string(), grantId: z.string() }), req.params);
  const membership = await requireActiveMembership(req, reply, params.householdId);
  if (!membership) return;
  if (membership.role !== "PARENT_ADMIN") return reply.code(403).send({ error: "FORBIDDEN" });

  await prisma.accessGrant.update({
    where: { id: params.grantId, householdId: params.householdId },
    data: { revokedAt: new Date() },
  });
  return { ok: true };
});

// Child logs (minimal CRUD: create + list last N)
function childLogRoutes() {
  const childParams = z.object({ childId: z.string() });
  const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

  async function ensureCanReadChild(req: any, reply: any, childId: string) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      reply.code(404).send({ error: "CHILD_NOT_FOUND" });
      return null;
    }
    const membership = await requireActiveMembership(req, reply, child.householdId);
    if (!membership) return null;
    if (!membership.permissions.canRead) {
      reply.code(403).send({ error: "FORBIDDEN" });
      return null;
    }
    return { child, membership };
  }

  app.post("/children/:childId/feedings", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        startedAt: z.string().datetime(),
        ounces: z.number().positive().max(64).optional(),
        type: FeedingTypeEnum,
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteFeeding) return reply.code(403).send({ error: "FORBIDDEN" });
    const feeding = await prisma.feeding.create({
      data: { childId: params.childId, userId: req.authUserId!, startedAt: new Date(body.startedAt), ounces: body.ounces, type: body.type, notes: body.notes },
    });
    return { feeding };
  });

  app.get("/children/:childId/feedings", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.feeding.findMany({
      where: { childId: params.childId },
      orderBy: { startedAt: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/sleeps", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        startedAt: z.string().datetime(),
        endedAt: z.string().datetime().optional(),
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteSleep) return reply.code(403).send({ error: "FORBIDDEN" });
    const sleep = await prisma.sleep.create({
      data: { childId: params.childId, userId: req.authUserId!, startedAt: new Date(body.startedAt), endedAt: body.endedAt ? new Date(body.endedAt) : null, notes: body.notes },
    });
    return { sleep };
  });

  app.get("/children/:childId/sleeps", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.sleep.findMany({
      where: { childId: params.childId },
      orderBy: { startedAt: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/meals", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        at: z.string().datetime(),
        type: MealTypeEnum,
        amount: z.string().optional(),
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteMeal) return reply.code(403).send({ error: "FORBIDDEN" });
    const meal = await prisma.meal.create({
      data: { childId: params.childId, userId: req.authUserId!, at: new Date(body.at), type: body.type, amount: body.amount, notes: body.notes },
    });
    return { meal };
  });

  app.get("/children/:childId/meals", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.meal.findMany({
      where: { childId: params.childId },
      orderBy: { at: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/symptoms", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        at: z.string().datetime(),
        name: z.string().min(1),
        severity: z.number().int().min(1).max(5).optional(),
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteSymptom) return reply.code(403).send({ error: "FORBIDDEN" });
    const symptom = await prisma.symptom.create({
      data: { childId: params.childId, userId: req.authUserId!, at: new Date(body.at), name: body.name, severity: body.severity, notes: body.notes },
    });
    return { symptom };
  });

  app.get("/children/:childId/symptoms", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.symptom.findMany({
      where: { childId: params.childId },
      orderBy: { at: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/illnesses", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        startedAt: z.string().datetime(),
        endedAt: z.string().datetime().optional(),
        diagnosis: z.string().optional(),
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteIllness) return reply.code(403).send({ error: "FORBIDDEN" });
    const illness = await prisma.illness.create({
      data: {
        childId: params.childId,
        userId: req.authUserId!,
        startedAt: new Date(body.startedAt),
        endedAt: body.endedAt ? new Date(body.endedAt) : null,
        diagnosis: body.diagnosis,
        notes: body.notes,
      },
    });
    return { illness };
  });

  app.get("/children/:childId/illnesses", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.illness.findMany({
      where: { childId: params.childId },
      orderBy: { startedAt: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/medicines", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        at: z.string().datetime(),
        name: z.string().min(1),
        dose: z.number().positive().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteMedicine) return reply.code(403).send({ error: "FORBIDDEN" });
    const medicine = await prisma.medicine.create({
      data: { childId: params.childId, userId: req.authUserId!, at: new Date(body.at), name: body.name, dose: body.dose, unit: body.unit, notes: body.notes },
    });
    return { medicine };
  });

  app.get("/children/:childId/medicines", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.medicine.findMany({
      where: { childId: params.childId },
      orderBy: { at: "desc" },
      take: query.limit,
    });
    return { items };
  });

  app.post("/children/:childId/moods", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const body = zodParse(
      z.object({
        at: z.string().datetime(),
        mood: MoodTypeEnum,
        notes: z.string().optional(),
      }),
      req.body,
    );
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    if (!access.membership.permissions.canWriteMood) return reply.code(403).send({ error: "FORBIDDEN" });
    const mood = await prisma.mood.create({
      data: { childId: params.childId, userId: req.authUserId!, at: new Date(body.at), mood: body.mood, notes: body.notes },
    });
    return { mood };
  });

  app.get("/children/:childId/moods", { preHandler: requireAuth }, async (req: any, reply) => {
    const params = zodParse(childParams, req.params);
    const query = zodParse(listQuery, req.query);
    const access = await ensureCanReadChild(req, reply, params.childId);
    if (!access) return;
    const items = await prisma.mood.findMany({
      where: { childId: params.childId },
      orderBy: { at: "desc" },
      take: query.limit,
    });
    return { items };
  });
}

childLogRoutes();

// Goals
app.put("/children/:childId/goals", { preHandler: requireAuth }, async (req: any, reply) => {
  const params = zodParse(z.object({ childId: z.string() }), req.params);
  const body = zodParse(
    z.object({
      timezone: z.string().optional(),
      dailyOuncesGoal: z.number().positive().max(128).optional().nullable(),
      dailySleepMinutesGoal: z.number().int().positive().max(24 * 60).optional().nullable(),
    }),
    req.body,
  );
  const child = await prisma.child.findUnique({ where: { id: params.childId } });
  if (!child) return reply.code(404).send({ error: "CHILD_NOT_FOUND" });
  const membership = await requireActiveMembership(req, reply, child.householdId);
  if (!membership) return;
  if (!membership.permissions.canRead) return reply.code(403).send({ error: "FORBIDDEN" });

  const goalSettings = await prisma.goalSettings.upsert({
    where: { childId: params.childId },
    create: {
      childId: params.childId,
      timezone: body.timezone ?? "America/Mexico_City",
      dailyOuncesGoal: body.dailyOuncesGoal ?? null,
      dailySleepMinutesGoal: body.dailySleepMinutesGoal ?? null,
    },
    update: {
      timezone: body.timezone ?? undefined,
      dailyOuncesGoal: body.dailyOuncesGoal ?? undefined,
      dailySleepMinutesGoal: body.dailySleepMinutesGoal ?? undefined,
    },
  });
  return { goalSettings };
});

// Alexa endpoint (stub): expects account linking accessToken to be a Bebio JWT
app.post("/alexa", async (req, reply) => {
  const { handler } = await import("./alexa.js");
  return handler(app, req, reply);
});

const port = env.PORT;
const host = env.HOST;
await app.listen({ port, host });

