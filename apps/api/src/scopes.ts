export const SCOPES = {
  EVENTS_READ: "events:read",
  EVENTS_WRITE: "events:write",
  MEMBERS_READ: "members:read",
  MEMBERS_MANAGE: "members:manage",
  GOALS_READ: "goals:read",
  GOALS_MANAGE: "goals:manage",
  BABY_MANAGE: "baby:manage",
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

export const DEFAULT_PARENT_SCOPES: Scope[] = Object.values(SCOPES);

export const DEFAULT_FAMILY_SCOPES: Scope[] = [
  SCOPES.EVENTS_READ,
  SCOPES.EVENTS_WRITE,
  SCOPES.GOALS_READ,
  SCOPES.MEMBERS_READ,
];

export const DEFAULT_NANNY_SCOPES: Scope[] = [
  SCOPES.EVENTS_READ,
  SCOPES.EVENTS_WRITE,
];

