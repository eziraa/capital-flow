"use server";

import type { Stage } from "@prisma/client";

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
import { canChangeStage } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/stage-machine";
import { changeStageSchema, type ChangeStageInput } from "@/lib/validation/opportunity";
import { fieldErrorsFrom } from "@/lib/zod-errors";

/**
 * Moves an opportunity to a new stage. The transition table is enforced
 * here, on the server, against the record's *current* stage as read inside
 * the transaction — never against whatever stage the client claims the
 * record is in. The stage update and its activity record are written
 * together so a failure of either rolls back both.
 */
export async function changeOpportunityStage(
  input: ChangeStageInput,
): Promise<ActionResult<{ id: string; stage: Stage }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canChangeStage(user.role)) {
    return forbidden("Only admins and reviewers can change an opportunity's stage.");
  }

  const parsed = changeStageSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { opportunityId, stage: newStage } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) {
        throw new ActionFlowError(notFound());
      }
      if (opportunity.archivedAt) {
        throw new ActionFlowError(conflict("Archived opportunities cannot change stage. Restore it first."));
      }
      if (!canTransition(opportunity.stage, newStage)) {
        throw new ActionFlowError(
          conflict(`An opportunity in ${opportunity.stage} cannot move to ${newStage}.`),
        );
      }

      const updated = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { stage: newStage },
      });

      await tx.activity.create({
        data: {
          opportunityId,
          type: "STAGE_CHANGED",
          actorId: user.id,
          previousStage: opportunity.stage,
          newStage,
        },
      });

      return updated;
    });

    return ok({ id: result.id, stage: result.stage });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("changeOpportunityStage failed", error);
    return unknownError();
  }
}

/** `useActionState`-compatible adapter for the stage-transition buttons. */
export async function changeOpportunityStageFormAction(
  _prevState: ActionResult<{ id: string; stage: Stage }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; stage: Stage }>> {
  return changeOpportunityStage({
    opportunityId: formData.get("opportunityId") as string,
    stage: formData.get("stage") as ChangeStageInput["stage"],
  });
}
