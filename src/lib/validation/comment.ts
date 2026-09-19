import { z } from "zod";

export const addCommentSchema = z.object({
  opportunityId: z.string().min(1, "Missing opportunity id"),
  body: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const editCommentSchema = z.object({
  commentId: z.string().min(1, "Missing comment id"),
  body: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
export type EditCommentInput = z.infer<typeof editCommentSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, "Missing comment id"),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
