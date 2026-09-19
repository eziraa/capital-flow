"use server";

import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { getActingUser } from "@/lib/acting-user";
import {
  ActionFlowError,
  type ActionResult,
  conflict,
  forbidden,
  notFound,
  ok,
  unauthenticated,
  unknownError,
  validationError,
} from "@/lib/action-result";
import { canManageUsers } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  setUserPasswordSchema,
  updateUserSchema,
  userIdSchema,
  type CreateUserInput,
  type SetUserPasswordInput,
  type UpdateUserInput,
  type UserIdInput,
} from "@/lib/validation/user";
import { fieldErrorsFrom } from "@/lib/zod-errors";

const PASSWORD_SALT_ROUNDS = 10;

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabledAt: Date | null;
  createdAt: Date;
  createdOpportunityCount: number;
  activeReviewingCount: number;
};

/** Admin-only: every user account, with a couple of activity counts for context. */
export async function listUsers(): Promise<ActionResult<UserListItem[]>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canManageUsers(actingUser.role)) return forbidden("Only admins can manage users.");

  try {
    const [users, reviewingCounts] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { createdOpportunities: true } } },
      }),
      prisma.opportunity.groupBy({
        by: ["reviewerId"],
        where: { archivedAt: null, reviewerId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const activeReviewingByUserId = new Map(reviewingCounts.map((r) => [r.reviewerId, r._count._all]));

    return ok(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        disabledAt: user.disabledAt,
        createdAt: user.createdAt,
        createdOpportunityCount: user._count.createdOpportunities,
        activeReviewingCount: activeReviewingByUserId.get(user.id) ?? 0,
      })),
    );
  } catch (error) {
    console.error("listUsers failed", error);
    return unknownError();
  }
}

export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canManageUsers(actingUser.role)) return forbidden("Only admins can create users.");

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));
  const { name, email, password, role } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return validationError({ email: ["A user with this email already exists."] });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({ data: { name, email, role, passwordHash } });
    return ok({ id: user.id });
  } catch (error) {
    console.error("createUser failed", error);
    return unknownError();
  }
}

export async function updateUser(input: UpdateUserInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canManageUsers(actingUser.role)) return forbidden("Only admins can edit users.");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));
  const { id, name, email, role } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new ActionFlowError(notFound());

      if (email !== target.email) {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) {
          throw new ActionFlowError(validationError({ email: ["A user with this email already exists."] }));
        }
      }

      if (target.role === "ADMIN" && role !== "ADMIN") {
        const otherActiveAdmins = await tx.user.count({
          where: { role: "ADMIN", disabledAt: null, id: { not: id } },
        });
        if (otherActiveAdmins === 0) {
          throw new ActionFlowError(conflict("You can't remove the last admin. Promote another admin first."));
        }
      }

      if (target.role === "REVIEWER" && role !== "REVIEWER") {
        const activeAssignments = await tx.opportunity.count({
          where: { reviewerId: id, archivedAt: null },
        });
        if (activeAssignments > 0) {
          const noun = activeAssignments === 1 ? "opportunity" : "opportunities";
          throw new ActionFlowError(
            conflict(
              `${target.name} still has ${activeAssignments} active ${noun} assigned. Reassign them first.`,
            ),
          );
        }
      }

      return tx.user.update({ where: { id }, data: { name, email, role } });
    });

    return ok({ id: updated.id });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("updateUser failed", error);
    return unknownError();
  }
}

export async function setUserPassword(input: SetUserPasswordInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canManageUsers(actingUser.role)) return forbidden("Only admins can reset passwords.");

  const parsed = setUserPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));
  const { id, password } = parsed.data;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound();

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const updated = await prisma.user.update({ where: { id }, data: { passwordHash } });
    return ok({ id: updated.id });
  } catch (error) {
    console.error("setUserPassword failed", error);
    return unknownError();
  }
}

async function setUserDisabled(
  actingUserId: string,
  actingUserRole: UserRole,
  id: string,
  disabled: boolean,
): Promise<ActionResult<{ id: string }>> {
  if (!canManageUsers(actingUserRole)) return forbidden("Only admins can enable or disable users.");

  if (disabled && id === actingUserId) {
    return conflict("You can't disable your own account.");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new ActionFlowError(notFound());

      if (disabled && target.role === "ADMIN") {
        const otherActiveAdmins = await tx.user.count({
          where: { role: "ADMIN", disabledAt: null, id: { not: id } },
        });
        if (otherActiveAdmins === 0) {
          throw new ActionFlowError(conflict("You can't disable the last admin."));
        }
      }

      return tx.user.update({ where: { id }, data: { disabledAt: disabled ? new Date() : null } });
    });

    return ok({ id: updated.id });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("setUserDisabled failed", error);
    return unknownError();
  }
}

export async function disableUser(input: UserIdInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  return setUserDisabled(actingUser.id, actingUser.role, parsed.data.id, true);
}

export async function enableUser(input: UserIdInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  return setUserDisabled(actingUser.id, actingUser.role, parsed.data.id, false);
}

/** `useActionState`-compatible adapters for the user forms. */
export async function createUserFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createUser({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  } as unknown as CreateUserInput);
}

export async function updateUserFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return updateUser({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  } as unknown as UpdateUserInput);
}

export async function setUserPasswordFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return setUserPassword({
    id: formData.get("id"),
    password: formData.get("password"),
  } as unknown as SetUserPasswordInput);
}

export async function disableUserFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return disableUser({ id: formData.get("id") as string });
}

export async function enableUserFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return enableUser({ id: formData.get("id") as string });
}
