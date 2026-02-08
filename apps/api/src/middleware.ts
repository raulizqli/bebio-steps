import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "./prisma.js";
import { coerceMemberRole, mergedPermissions, type MemberPermissions, type MemberRole } from "./permissions.js";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }
  const user = req.user as { sub?: string };
  if (!user?.sub) return reply.code(401).send({ error: "UNAUTHORIZED" });
  req.authUserId = user.sub;
}

export type ActiveMembership = {
  memberId: string;
  householdId: string;
  role: MemberRole;
  permissions: MemberPermissions;
};

export async function requireActiveMembership(
  req: FastifyRequest,
  reply: FastifyReply,
  householdId: string,
): Promise<ActiveMembership | null> {
  if (!req.authUserId) {
    reply.code(401).send({ error: "UNAUTHORIZED" });
    return null;
  }
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: req.authUserId } },
  });
  if (!member) {
    reply.code(403).send({ error: "NOT_A_MEMBER" });
    return null;
  }
  if (member.revokedAt) {
    reply.code(403).send({ error: "MEMBERSHIP_REVOKED" });
    return null;
  }
  if (member.expiresAt && member.expiresAt.getTime() <= Date.now()) {
    reply.code(403).send({ error: "MEMBERSHIP_EXPIRED" });
    return null;
  }
  const role = coerceMemberRole(member.role);
  const permissions = mergedPermissions(role, member.permissionsJson);
  return { memberId: member.id, householdId, role, permissions };
}

