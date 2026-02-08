import type { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "@fastify/jwt";
import { getEnv } from "./env.js";

export async function registerAuth(app: FastifyInstance) {
  const env = getEnv();

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate("authenticate", async (request: FastifyRequest) => {
    await request.jwtVerify();
  });
}

export function getUserIdFromRequest(request: FastifyRequest): string {
  // fastify-jwt module augmentation sets request.user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (request as any).user as { sub: string } | undefined;
  if (!user?.sub) throw new Error("Unauthenticated");
  return user.sub;
}

