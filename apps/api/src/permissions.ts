export const MemberRoleValues = ["PARENT_ADMIN", "PARENT", "CAREGIVER"] as const;
export type MemberRole = (typeof MemberRoleValues)[number];

export function coerceMemberRole(value: string): MemberRole {
  if ((MemberRoleValues as readonly string[]).includes(value)) return value as MemberRole;
  return "CAREGIVER";
}

export type MemberPermissions = {
  canRead?: boolean;
  canWriteFeeding?: boolean;
  canWriteSleep?: boolean;
  canWriteMeal?: boolean;
  canWriteSymptom?: boolean;
  canWriteIllness?: boolean;
  canWriteMedicine?: boolean;
  canWriteMood?: boolean;
  canManageMembers?: boolean;
};

export function parsePermissionsJson(value: string | null | undefined): MemberPermissions {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed as MemberPermissions;
    return {};
  } catch {
    return {};
  }
}

export function defaultPermissionsForRole(role: MemberRole): MemberPermissions {
  if (role === "PARENT_ADMIN") {
    return {
      canRead: true,
      canWriteFeeding: true,
      canWriteSleep: true,
      canWriteMeal: true,
      canWriteSymptom: true,
      canWriteIllness: true,
      canWriteMedicine: true,
      canWriteMood: true,
      canManageMembers: true,
    };
  }
  if (role === "PARENT") {
    return {
      canRead: true,
      canWriteFeeding: true,
      canWriteSleep: true,
      canWriteMeal: true,
      canWriteSymptom: true,
      canWriteIllness: true,
      canWriteMedicine: true,
      canWriteMood: true,
    };
  }
  // CAREGIVER (nanny/family) defaults: read + selected writes (can be narrowed by permissionsJson)
  return {
    canRead: true,
    canWriteFeeding: true,
    canWriteSleep: true,
    canWriteMeal: true,
    canWriteSymptom: true,
    canWriteIllness: false,
    canWriteMedicine: true,
    canWriteMood: true,
    canManageMembers: false,
  };
}

export function mergedPermissions(role: MemberRole, permissionsJson?: string | null): MemberPermissions {
  const base = defaultPermissionsForRole(role);
  const extra = parsePermissionsJson(permissionsJson);
  return { ...base, ...extra };
}

export function hasPermission(perms: MemberPermissions, key: keyof MemberPermissions) {
  return perms[key] === true;
}

