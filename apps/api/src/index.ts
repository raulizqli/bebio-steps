import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { getEnv } from "./env.js";
import { registerAuth, getUserIdFromRequest } from "./auth.js";
import { HttpError, requireMembership } from "./guards.js";
import { DEFAULT_FAMILY_SCOPES, DEFAULT_NANNY_SCOPES, DEFAULT_PARENT_SCOPES, SCOPES } from "./scopes.js";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { EventType, MembershipRole } from "@prisma/client";
import { startNotificationScheduler } from "./notifications.js";

const env = getEnv();

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true },
          },
  },
});

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof HttpError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }
  if ((err as any)?.validation) {
    return reply.status(400).send({ error: "Invalid request", details: (err as any).validation });
  }
  app.log.error(err);
  return reply.status(500).send({ error: "Internal server error" });
});

await app.register(cors, { origin: true });
await app.register(swagger, {
  openapi: {
    info: {
      title: "Bebio API",
      version: "0.1.0",
    },
  },
});
await app.register(swaggerUi, { routePrefix: "/docs" });

await registerAuth(app);

app.get("/health", async () => ({ ok: true }));

// ---- Auth ----
app.post("/auth/register", async (request, reply) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    })
    .parse(request.body);

  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new HttpError(409, "Email ya registrado");

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: { email: body.email, passwordHash, name: body.name },
    select: { id: true, email: true, name: true },
  });

  const token = app.jwt.sign({ sub: user.id });
  return reply.status(201).send({ user, token });
});

app.post("/auth/login", async (request) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .parse(request.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) throw new HttpError(401, "Credenciales inválidas");
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Credenciales inválidas");

  const token = app.jwt.sign({ sub: user.id });
  return { user: { id: user.id, email: user.email, name: user.name }, token };
});

// ---- Babies ----
app.get("/babies", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const babies = await prisma.baby.findMany({
    where: {
      memberships: {
        some: {
          userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return { babies };
});

// ---- Push tokens (Expo) ----
app.post("/me/push-tokens", { preHandler: app.authenticate }, async (request, reply) => {
  const userId = getUserIdFromRequest(request);
  const body = z
    .object({
      token: z.string().min(10),
      platform: z.string().optional(),
    })
    .parse(request.body);

  const saved = await prisma.pushToken.upsert({
    where: { token: body.token },
    create: { userId, token: body.token, platform: body.platform },
    update: { userId, platform: body.platform },
  });

  return reply.status(201).send({ pushToken: saved });
});

app.post("/babies", { preHandler: app.authenticate }, async (request, reply) => {
  const userId = getUserIdFromRequest(request);
  const body = z
    .object({
      name: z.string().min(1),
      birthDate: z.string().datetime().optional(),
      timezone: z.string().optional(),
    })
    .parse(request.body);

  const baby = await prisma.baby.create({
    data: {
      name: body.name,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      timezone: body.timezone ?? undefined,
      memberships: {
        create: {
          userId,
          role: MembershipRole.PARENT,
          scopes: DEFAULT_PARENT_SCOPES,
        },
      },
      goal: { create: {} },
    },
  });
  return reply.status(201).send({ baby });
});

// ---- Members / Invites ----
app.get("/babies/:babyId/members", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.MEMBERS_READ] });

  const members = await prisma.membership.findMany({
    where: { babyId: params.babyId, revokedAt: null },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return { members };
});

app.post("/babies/:babyId/invites", { preHandler: app.authenticate }, async (request, reply) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.MEMBERS_MANAGE] });

  const body = z
    .object({
      role: z.nativeEnum(MembershipRole),
      scopes: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
      expiresInHours: z.number().positive().optional(),
    })
    .refine((b) => !(b.expiresAt && b.expiresInHours), {
      message: "Usa expiresAt o expiresInHours, no ambos",
    })
    .parse(request.body);

  const scopes =
    body.scopes ??
    (body.role === MembershipRole.PARENT
      ? DEFAULT_PARENT_SCOPES
      : body.role === MembershipRole.FAMILY
        ? DEFAULT_FAMILY_SCOPES
        : DEFAULT_NANNY_SCOPES);

  const expiresAt =
    body.expiresAt ? new Date(body.expiresAt) : body.expiresInHours ? new Date(Date.now() + body.expiresInHours * 3600_000) : null;

  const invite = await prisma.invite.create({
    data: {
      babyId: params.babyId,
      code: nanoid(10),
      role: body.role,
      scopes,
      expiresAt,
      createdById: userId,
    },
  });
  return reply.status(201).send({ invite });
});

app.post("/invites/accept", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const body = z.object({ code: z.string().min(6) }).parse(request.body);

  const invite = await prisma.invite.findUnique({ where: { code: body.code } });
  if (!invite) throw new HttpError(404, "Código inválido");
  if (invite.revokedAt) throw new HttpError(400, "Código revocado");
  if (invite.usedAt) throw new HttpError(400, "Código ya usado");
  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) throw new HttpError(400, "Código expirado");

  const membership = await prisma.membership.upsert({
    where: { babyId_userId: { babyId: invite.babyId, userId } },
    create: {
      babyId: invite.babyId,
      userId,
      role: invite.role,
      scopes: invite.scopes,
      expiresAt: invite.expiresAt,
    },
    update: {
      role: invite.role,
      scopes: invite.scopes,
      expiresAt: invite.expiresAt,
      revokedAt: null,
    },
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedById: userId },
  });

  return { membership };
});

app.delete("/babies/:babyId/members/:memberUserId", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string(), memberUserId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.MEMBERS_MANAGE] });

  if (params.memberUserId === userId) throw new HttpError(400, "No puedes revocarte a ti mismo");

  const updated = await prisma.membership.update({
    where: { babyId_userId: { babyId: params.babyId, userId: params.memberUserId } },
    data: { revokedAt: new Date() },
  });
  return { member: updated };
});

app.patch("/babies/:babyId/members/:memberUserId", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string(), memberUserId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.MEMBERS_MANAGE] });

  const body = z
    .object({
      scopes: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().nullable().optional(),
    })
    .parse(request.body);

  const member = await prisma.membership.update({
    where: { babyId_userId: { babyId: params.babyId, userId: params.memberUserId } },
    data: {
      scopes: body.scopes,
      expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt === null ? null : new Date(body.expiresAt),
    },
  });
  return { member };
});

// ---- Events ----
app.get("/babies/:babyId/events", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  const query = z
    .object({
      limit: z.coerce.number().min(1).max(200).default(50),
      cursor: z.string().optional(),
      type: z.nativeEnum(EventType).optional(),
    })
    .parse(request.query);

  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.EVENTS_READ] });

  const events = await prisma.event.findMany({
    where: {
      babyId: params.babyId,
      type: query.type,
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: query.limit,
    ...(query.cursor
      ? {
          skip: 1,
          cursor: { id: query.cursor },
        }
      : {}),
  });

  return { events, nextCursor: events.length ? events.at(-1)!.id : null };
});

app.post("/babies/:babyId/events", { preHandler: app.authenticate }, async (request, reply) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.EVENTS_WRITE] });

  const body = z
    .object({
      type: z.nativeEnum(EventType),
      occurredAt: z.string().datetime().optional(),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().optional(),
      amountOz: z.number().positive().optional(),
      mood: z.string().optional(),
      notes: z.string().optional(),
      data: z.unknown().optional(),
    })
    .parse(request.body);

  const event = await prisma.event.create({
    data: {
      babyId: params.babyId,
      createdById: userId,
      type: body.type,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      amountOz: body.amountOz,
      mood: body.mood,
      notes: body.notes,
      data: body.data as any,
    },
  });

  return reply.status(201).send({ event });
});

// ---- Goals ----
app.get("/babies/:babyId/goals", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.GOALS_READ] });

  const goal = await prisma.goal.findUnique({ where: { babyId: params.babyId } });
  return { goal };
});

app.put("/babies/:babyId/goals", { preHandler: app.authenticate }, async (request) => {
  const userId = getUserIdFromRequest(request);
  const params = z.object({ babyId: z.string() }).parse(request.params);
  await requireMembership({ babyId: params.babyId, userId, requiredScopes: [SCOPES.GOALS_MANAGE] });

  const body = z
    .object({
      dailyOzGoal: z.number().min(0).optional(),
      dailySleepHoursGoal: z.number().min(0).optional(),
    })
    .parse(request.body);

  const goal = await prisma.goal.upsert({
    where: { babyId: params.babyId },
    create: { babyId: params.babyId, dailyOzGoal: body.dailyOzGoal ?? 0, dailySleepHoursGoal: body.dailySleepHoursGoal ?? 0 },
    update: { ...body },
  });
  return { goal };
});

// ---- Alexa linking (MVP) ----
app.post("/alexa/link", async (request) => {
  const body = z.object({ amazonUserId: z.string().min(5), code: z.string().min(6) }).parse(request.body);

  const invite = await prisma.invite.findUnique({ where: { code: body.code } });
  if (!invite) throw new HttpError(404, "Código inválido");
  if (invite.revokedAt) throw new HttpError(400, "Código revocado");
  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) throw new HttpError(400, "Código expirado");

  const link = await prisma.alexaLink.upsert({
    where: { amazonUserId: body.amazonUserId },
    create: { amazonUserId: body.amazonUserId, babyId: invite.babyId, token: nanoid(32) },
    update: { babyId: invite.babyId },
  });

  return { token: link.token, babyId: link.babyId };
});

app.post("/alexa/feeding", async (request) => {
  const body = z.object({ amazonUserId: z.string(), token: z.string(), amountOz: z.number().positive() }).parse(request.body);

  const link = await prisma.alexaLink.findUnique({ where: { amazonUserId: body.amazonUserId } });
  if (!link || link.token !== body.token) throw new HttpError(401, "No vinculado");

  const event = await prisma.event.create({
    data: {
      babyId: link.babyId,
      type: EventType.FEEDING,
      amountOz: body.amountOz,
      notes: "Alexa",
    },
  });
  return { eventId: event.id };
});

app.get("/alexa/summary", async (request) => {
  const query = z.object({ amazonUserId: z.string(), token: z.string() }).parse(request.query);
  const link = await prisma.alexaLink.findUnique({ where: { amazonUserId: query.amazonUserId } });
  if (!link || link.token !== query.token) throw new HttpError(401, "No vinculado");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [feedings, sleeps] = await Promise.all([
    prisma.event.aggregate({
      where: { babyId: link.babyId, type: EventType.FEEDING, occurredAt: { gte: start, lte: end } },
      _sum: { amountOz: true },
      _count: true,
    }),
    prisma.event.findMany({
      where: { babyId: link.babyId, type: EventType.SLEEP, startAt: { not: null }, endAt: { not: null }, occurredAt: { gte: start, lte: end } },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const sleepMs = sleeps.reduce((acc, s) => acc + (s.endAt!.getTime() - s.startAt!.getTime()), 0);
  const sleepHours = Math.max(0, sleepMs / 3600_000);
  const ounces = feedings._sum.amountOz ?? 0;

  return { ounces, feedingCount: feedings._count, sleepHours };
});

async function main() {
  startNotificationScheduler(app);
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch(async (e) => {
  app.log.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

