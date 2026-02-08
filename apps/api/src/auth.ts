import type { FastifyInstance, FastifyRequest } from "fastify";
import argon2 from "argon2";
import { z } from "zod";

import { prisma } from "./prisma.js";

export const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type JwtUser = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function signUserJwt(app: FastifyInstance, user: { id: string; email: string }) {
  return app.jwt.sign({ sub: user.id, email: user.email } satisfies JwtUser, {
    expiresIn: "7d",
  });
}

export async function getAuthUser(req: FastifyRequest) {
  const jwtUser = req.user as JwtUser | undefined;
  if (!jwtUser?.sub) return null;
  return prisma.user.findUnique({ where: { id: jwtUser.sub } });
}

