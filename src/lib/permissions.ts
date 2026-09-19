import type { UserRole } from "@prisma/client";

/**
 * Direct, explicit role checks — deliberately not a generic policy/capability
 * system, per the assignment's guidance that one isn't required here.
 *
 * These functions describe what a role *may* attempt. They do not replace
 * the additional server-side checks (record state, ownership, archive
 * status) that each Server Action performs before writing.
 */

export function canCreateOpportunity(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canEditOpportunity(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canAssignReviewer(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canChangeStage(role: UserRole): boolean {
  return role === "ADMIN" || role === "REVIEWER";
}

export function canComment(role: UserRole): boolean {
  return role === "ADMIN" || role === "REVIEWER";
}

export function canArchiveOrRestore(role: UserRole): boolean {
  return role === "ADMIN";
}
