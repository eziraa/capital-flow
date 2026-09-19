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
import { 
  addCommentSchema, 
  editCommentSchema, 
  deleteCommentSchema,
  type AddCommentInput, 
  type EditCommentInput, 
  type DeleteCommentInput
} from "@/lib/validation/comment";
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

export async function editComment(input: EditCommentInput): Promise<ActionResult<CommentDTO>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  const parsed = editCommentSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { commentId, body } = parsed.data;

  try {
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) return notFound();
    if (existing.authorId !== user.id && user.role !== "ADMIN") {
      return forbidden("You can only edit your own comments.");
    }
    if (existing.deletedAt) return conflict("Cannot edit a deleted comment.");

    const opportunity = await prisma.opportunity.findUnique({ where: { id: existing.opportunityId } });
    if (opportunity?.archivedAt) {
      return conflict("Archived opportunities cannot have comments edited.");
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { body, isEdited: true },
      include: { author: true },
    });

    return ok(toCommentDTO(updated));
  } catch (error) {
    console.error("editComment failed", error);
    return unknownError();
  }
}

export async function deleteComment(input: DeleteCommentInput): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { commentId } = parsed.data;

  try {
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) return notFound();
    if (existing.authorId !== user.id && user.role !== "ADMIN") {
      return forbidden("You can only delete your own comments.");
    }

    const opportunity = await prisma.opportunity.findUnique({ where: { id: existing.opportunityId } });
    if (opportunity?.archivedAt) {
      return conflict("Archived opportunities cannot have comments deleted.");
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date(), body: "This comment was deleted." },
    });

    return ok({ id: commentId });
  } catch (error) {
    console.error("deleteComment failed", error);
    return unknownError();
  }
}

/** `useActionState`-compatible adapter for the comment forms. */
export async function addCommentFormAction(
  _prevState: ActionResult<CommentDTO> | null,
  formData: FormData,
): Promise<ActionResult<CommentDTO>> {
  return addComment({
    opportunityId: formData.get("opportunityId") as string,
    body: formData.get("body") as string,
  });
}

export async function editCommentFormAction(
  _prevState: ActionResult<CommentDTO> | null,
  formData: FormData,
): Promise<ActionResult<CommentDTO>> {
  return editComment({
    commentId: formData.get("commentId") as string,
    body: formData.get("body") as string,
  });
}

export async function deleteCommentFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return deleteComment({
    commentId: formData.get("commentId") as string,
  });
}
