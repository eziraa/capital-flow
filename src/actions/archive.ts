"use server";

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
import { canArchiveOrRestore } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { type ArchiveOpportunityInput, archiveOpportunitySchema } from "@/lib/validation/opportunity";
import { fieldErrorsFrom } from "@/lib/zod-errors";

export async function archiveOpportunity(
  input: ArchiveOpportunityInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canArchiveOrRestore(user.role)) {
    return forbidden("Only admins can archive an opportunity.");
  }

  const parsed = archiveOpportunitySchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { opportunityId } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) throw new ActionFlowError(notFound());
      if (opportunity.archivedAt) {
        throw new ActionFlowError(conflict("This opportunity is already archived."));
      }

      const result = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { archivedAt: new Date() },
      });

      await tx.activity.create({
        data: { opportunityId, type: "ARCHIVED", actorId: user.id },
      });

      return result;
    });

    return ok({ id: updated.id });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("archiveOpportunity failed", error);
    return unknownError();
  }
}

export async function restoreOpportunity(
  input: ArchiveOpportunityInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canArchiveOrRestore(user.role)) {
    return forbidden("Only admins can restore an opportunity.");
  }

  const parsed = archiveOpportunitySchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { opportunityId } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) throw new ActionFlowError(notFound());
      if (!opportunity.archivedAt) {
        throw new ActionFlowError(conflict("This opportunity is not archived."));
      }

      const result = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { archivedAt: null },
      });

      await tx.activity.create({
        data: { opportunityId, type: "RESTORED", actorId: user.id },
      });

      return result;
    });

    return ok({ id: updated.id });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("restoreOpportunity failed", error);
    return unknownError();
  }
}

/** `useActionState`-compatible adapters for the archive/restore buttons. */
export async function archiveOpportunityFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return archiveOpportunity({ opportunityId: formData.get("opportunityId") as string });
}

export async function restoreOpportunityFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return restoreOpportunity({ opportunityId: formData.get("opportunityId") as string });
}
