"use server";

import bcrypt from "bcryptjs";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, notFound, ok, unauthenticated, unknownError, validationError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import {
  updateMyProfileSchema,
  updateMyPasswordSchema,
  type UpdateMyProfileInput,
  type UpdateMyPasswordInput,
} from "@/lib/validation/profile";
import { fieldErrorsFrom } from "@/lib/zod-errors";

const PASSWORD_SALT_ROUNDS = 10;

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();

  const parsed = updateMyProfileSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  try {
    const updated = await prisma.user.update({
      where: { id: actingUser.id },
      data: { name: parsed.data.name },
    });
    return ok({ id: updated.id });
  } catch (error) {
    console.error("updateMyProfile failed", error);
    return unknownError();
  }
}

export async function updateMyPassword(input: UpdateMyPasswordInput): Promise<ActionResult<{ id: string }>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();

  const parsed = updateMyPasswordSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  try {
    const user = await prisma.user.findUnique({ where: { id: actingUser.id } });
    if (!user) return notFound();

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) {
      return validationError({ currentPassword: ["Incorrect current password."] });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, PASSWORD_SALT_ROUNDS);
    const updated = await prisma.user.update({
      where: { id: actingUser.id },
      data: { passwordHash },
    });
    return ok({ id: updated.id });
  } catch (error) {
    console.error("updateMyPassword failed", error);
    return unknownError();
  }
}

export async function updateMyProfileFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return updateMyProfile({ name: formData.get("name") as string });
}

export async function updateMyPasswordFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return updateMyPassword({
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
  });
}
