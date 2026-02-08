import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SkillBuilders } from "ask-sdk-core";
import type { HandlerInput } from "ask-sdk-core";
import type { Response } from "ask-sdk-model";
import dayjs from "dayjs";

import { prisma } from "./prisma.js";

function getAccessToken(input: HandlerInput): string | null {
  // When account linking is configured, Alexa provides this token.
  const token = (input.requestEnvelope.session as any)?.user?.accessToken ?? (input.requestEnvelope.context as any)?.System?.user?.accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

async function getUserIdFromJwt(app: FastifyInstance, token: string): Promise<string | null> {
  try {
    const decoded = app.jwt.verify<{ sub?: string }>(token);
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

function buildSkill(app: FastifyInstance) {
  function speak(input: HandlerInput, ssml: string, shouldEndSession: boolean): Response {
    input.responseBuilder.speak(ssml);
    input.responseBuilder.withShouldEndSession(shouldEndSession);
    return input.responseBuilder.getResponse();
  }

  const LaunchRequestHandler = {
    canHandle(input: HandlerInput) {
      return input.requestEnvelope.request.type === "LaunchRequest";
    },
    handle(input: HandlerInput): Response {
      return speak(
        input,
        "<speak>Bienvenido a Bebio. Puedes decir: registra una toma de cuatro onzas, o pregunta: ¿cuántas onzas lleva hoy?</speak>",
        false,
      );
    },
  };

  const HelpIntentHandler = {
    canHandle(input: HandlerInput) {
      return input.requestEnvelope.request.type === "IntentRequest" && input.requestEnvelope.request.intent.name === "AMAZON.HelpIntent";
    },
    handle(input: HandlerInput): Response {
      return speak(
        input,
        "<speak>Puedo registrar tomas y consultar el total del día. Por ejemplo: registra una toma de 4 onzas. O: ¿cuántas onzas lleva hoy?</speak>",
        false,
      );
    },
  };

  const LogFeedingIntentHandler = {
    canHandle(input: HandlerInput) {
      return input.requestEnvelope.request.type === "IntentRequest" && input.requestEnvelope.request.intent.name === "LogFeedingIntent";
    },
    async handle(input: HandlerInput): Promise<Response> {
      const token = getAccessToken(input);
      if (!token) {
        return speak(input, "<speak>Necesitas vincular tu cuenta para usar Bebio.</speak>", true);
      }

      const userId = await getUserIdFromJwt(app, token);
      if (!userId) {
        return speak(input, "<speak>No pude validar tu cuenta. Vuelve a vincular tu cuenta.</speak>", true);
      }

      const request = input.requestEnvelope.request as any;
      const ouncesRaw = request.intent?.slots?.ounces?.value;
      const ounces = ouncesRaw ? Number(ouncesRaw) : NaN;
      if (!Number.isFinite(ounces) || ounces <= 0) {
        return speak(input, "<speak>¿Cuántas onzas fue la toma?</speak>", false);
      }

      // Choose the most recently created child across all households the user can access.
      const child = await prisma.child.findFirst({
        where: { household: { members: { some: { userId, revokedAt: null } } } },
        orderBy: { createdAt: "desc" },
      });
      if (!child) {
        return speak(input, "<speak>No encontré un bebé configurado. Abre la app para crear un perfil primero.</speak>", true);
      }

      await prisma.feeding.create({
        data: {
          childId: child.id,
          userId,
          startedAt: new Date(),
          ounces,
          type: "BOTTLE",
        },
      });

      return speak(input, `<speak>Listo. Registré una toma de ${ounces} onzas.</speak>`, true);
    },
  };

  const OuncesTodayIntentHandler = {
    canHandle(input: HandlerInput) {
      return input.requestEnvelope.request.type === "IntentRequest" && input.requestEnvelope.request.intent.name === "OuncesTodayIntent";
    },
    async handle(input: HandlerInput): Promise<Response> {
      const token = getAccessToken(input);
      if (!token) {
        return speak(input, "<speak>Necesitas vincular tu cuenta para usar Bebio.</speak>", true);
      }
      const userId = await getUserIdFromJwt(app, token);
      if (!userId) {
        return speak(input, "<speak>No pude validar tu cuenta. Vuelve a vincular tu cuenta.</speak>", true);
      }

      const child = await prisma.child.findFirst({
        where: { household: { members: { some: { userId, revokedAt: null } } } },
        orderBy: { createdAt: "desc" },
      });
      if (!child) {
        return speak(input, "<speak>No encontré un bebé configurado. Abre la app para crear un perfil primero.</speak>", true);
      }

      const start = dayjs().startOf("day").toDate();
      const end = dayjs().endOf("day").toDate();
      const feedings = await prisma.feeding.findMany({
        where: { childId: child.id, startedAt: { gte: start, lte: end } },
        select: { ounces: true },
      });
      const total = feedings.reduce((sum, f) => sum + (f.ounces ?? 0), 0);
      return speak(input, `<speak>Hoy lleva ${total.toFixed(0)} onzas.</speak>`, true);
    },
  };

  const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(_input: HandlerInput, error: Error): Response {
      // eslint-disable-next-line no-console
      console.error("Alexa error", error);
      return speak(_input, "<speak>Tuve un problema procesando la solicitud.</speak>", true);
    },
  };

  return SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler, HelpIntentHandler, LogFeedingIntentHandler, OuncesTodayIntentHandler)
    .addErrorHandlers(ErrorHandler)
    .create();
}

export async function handler(app: FastifyInstance, req: FastifyRequest, reply: FastifyReply) {
  const skill = buildSkill(app);
  const res = await skill.invoke(req.body as any, undefined);
  reply.header("Content-Type", "application/json");
  return reply.send(res);
}

