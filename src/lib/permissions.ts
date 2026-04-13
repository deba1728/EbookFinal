// ============================================================
// RBAC Permissions Configuration
// ============================================================
// Shared between server (auth.ts) and client (auth-client.ts)
// to ensure consistent access control.
// ============================================================

import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define access control statements for each resource.
 * Each resource lists the possible actions.
 */
export const ac = createAccessControl({
  book: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  transaction: ["create", "read", "update", "delete"],
  purchase: ["create", "read", "update", "delete"],
  report: ["read"],
  user: ["create", "read", "update", "delete", "ban"],
});

/**
 * Admin role — full access to all resources
 */
export const adminRole = ac.newRole({
  book: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  transaction: ["create", "read", "update", "delete"],
  purchase: ["create", "read", "update", "delete"],
  report: ["read"],
  user: ["create", "read", "update", "delete", "ban"],
});

/**
 * User role — limited to reading books and own transactions
 */
export const userRole = ac.newRole({
  book: ["read"],
  member: ["read"],
  transaction: ["read"],
  purchase: [],
  report: [],
  user: ["read"],
});

export const roles = {
  admin: adminRole,
  user: userRole,
};
