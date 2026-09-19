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
import { toActivityDTO, toCommentDTO, type ActivityDTO, type CommentDTO } from "@/lib/dto";
import { canComment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { type AddCommentInput, addCommentSchema } from "@/lib/validation/comment";
import { fieldErrorsFrom } from "@/lib/zod-errors";

export async function listComments(opportunityId: string): Promise<ActionResult<CommentDTO[]>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  try {
    const comments = await prisma.comment.findMany({
      where: { opportunityId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    return ok(comments.map(toCommentDTO));
  } catch (error) {
    console.error("listComments failed", error);
    return unknownError();
  }
}

export async function listActivity(opportunityId: string): Promise<ActionResult<ActivityDTO[]>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  try {
    const activities = await prisma.activity.findMany({
      where: { opportunityId },
      include: { actor: true, previousReviewer: true, newReviewer: true, comment: true },
      orderBy: { createdAt: "asc" },
    });

    return ok(activities.map(toActivityDTO));
  } catch (error) {
    console.error("listActivity failed", error);
    return unknownError();
  }
}

export async function addComment(input: AddCommentInput): Promise<ActionResult<CommentDTO>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canComment(user.role)) {
    return forbidden("Only admins and reviewers can add comments.");
  }

  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { opportunityId, body } = parsed.data;

  try {
    const comment = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) {
        throw new ActionFlowError(notFound());
      }
      if (opportunity.archivedAt) {
        throw new ActionFlowError(conflict("Archived opportunities cannot receive new comments."));
      }

      const created = await tx.comment.create({
        data: { opportunityId, authorId: user.id, body },
        include: { author: true },
      });

      await tx.activity.create({
        data: {
          opportunityId,
          type: "COMMENT_ADDED",
          actorId: user.id,
          commentId: created.id,
        },
      });

      return created;
    });

    return ok(toCommentDTO(comment));
  } catch (error) {
    if (error instanceof ActionFlowError) return error.result;
    console.error("addComment failed", error);
    return unknownError();
  }
}

/** `useActionState`-compatible adapter for the comment form. */
export async function addCommentFormAction(
  _prevState: ActionResult<CommentDTO> | null,
  formData: FormData,
): Promise<ActionResult<CommentDTO>> {
  return addComment({
    opportunityId: formData.get("opportunityId") as string,
    body: formData.get("body") as string,
  });
}
