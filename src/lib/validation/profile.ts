import { z } from "zod";

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;

export const updateMyPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export type UpdateMyPasswordInput = z.infer<typeof updateMyPasswordSchema>;
