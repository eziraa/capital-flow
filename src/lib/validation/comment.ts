import { z } from "zod";

export const addCommentSchema = z.object({
  opportunityId: z.string().min(1, "Missing opportunity id"),
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be 1000 characters or fewer"),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
