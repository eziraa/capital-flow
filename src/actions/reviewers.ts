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
import { canAssignReviewer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { type AssignReviewerInput, assignReviewerSchema } from "@/lib/validation/opportunity";
import { fieldErrorsFrom } from "@/lib/zod-errors";

export type ReviewerOption = { id: string; name: string; email: string };

/** Admin-only: the list of users eligible to be assigned as a reviewer. */
export async function listReviewers(): Promise<ActionResult<ReviewerOption[]>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canAssignReviewer(user.role)) {
    return forbidden("Only admins can view the reviewer list.");
  }

  try {
    const reviewers = await prisma.user.findMany({
      where: { role: "REVIEWER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });

    return ok(reviewers);
  } catch (error) {
    console.error("listReviewers failed", error);
    return unknownError();
  }
}

export async function assignReviewer(
  input: AssignReviewerInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canAssignReviewer(user.role)) {
    return forbidden("Only admins can assign a reviewer.");
  }

  const parsed = assignReviewerSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { opportunityId, reviewerId } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) {
        throw new ActionFlowError(notFound());
      }
      if (opportunity.archivedAt) {
        throw new ActionFlowError(conflict("Archived opportunities cannot be reassigned. Restore it first."));
      }
      if (opportunity.reviewerId === reviewerId) {
        // No-op: nothing changed, so nothing to record.
        return opportunity;
      }

      if (reviewerId) {
        const reviewer = await tx.user.findUnique({ where: { id: reviewerId } });
        if (!reviewer || reviewer.role !== "REVIEWER") {
          throw new ActionFlowError(validationError({ reviewerId: ["Selected user is not a reviewer."] }));
        }
      }

      const result = await tx.opportunity.update({
        where: { id: opportunityId },
        data: { reviewerId },
      });

      await tx.activity.create({
        data: {
          opportunityId,
          type: "REVIEWER_ASSIGNED",
          actorId: user.id,
          previousReviewerId: opportunity.reviewerId,
          newReviewerId: reviewerId,
        },
      });

      return result;
    });

    return ok({ id: updated.id });
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("assignReviewer failed", error);
    return unknownError();
  }
}

/** `useActionState`-compatible adapter for the reviewer-assignment form. */
export async function assignReviewerFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const rawReviewerId = formData.get("reviewerId");
  // Radix's Select can't use an empty string as an item value, so the
  // "Unassigned" option carries this sentinel instead — see UNASSIGNED_VALUE
  // in ReviewerAssignPanel.tsx.
  const reviewerId = rawReviewerId && rawReviewerId !== "unassigned" ? (rawReviewerId as string) : null;
  return assignReviewer({
    opportunityId: formData.get("opportunityId") as string,
    reviewerId,
  });
}
