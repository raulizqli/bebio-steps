import { describe, expect, it } from "vitest";

import { coerceMemberRole, defaultPermissionsForRole, mergedPermissions } from "./permissions.js";

describe("permissions", () => {
  it("coerces unknown role to CAREGIVER", () => {
    expect(coerceMemberRole("NOPE")).toBe("CAREGIVER");
  });

  it("admin has canManageMembers", () => {
    const p = defaultPermissionsForRole("PARENT_ADMIN");
    expect(p.canManageMembers).toBe(true);
  });

  it("mergedPermissions overrides defaults", () => {
    const p = mergedPermissions("CAREGIVER", JSON.stringify({ canWriteIllness: true }));
    expect(p.canWriteIllness).toBe(true);
  });
});

