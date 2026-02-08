import { prisma } from "./prisma.js";

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function requireMembership(params: {
  babyId: string;
  userId: string;
  requiredScopes?: string[];
}) {
  const membership = await prisma.membership.findUnique({
    where: { babyId_userId: { babyId: params.babyId, userId: params.userId } },
  });
  if (!membership) throw new HttpError(403, "No tienes acceso a este bebé");
  if (membership.revokedAt) throw new HttpError(403, "Acceso revocado");
  if (membership.expiresAt && membership.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(403, "Acceso expirado");
  }
  if (params.requiredScopes?.length) {
    const missing = params.requiredScopes.filter((s) => !membership.scopes.includes(s));
    if (missing.length) throw new HttpError(403, "Permisos insuficientes");
  }
  return membership;
}

