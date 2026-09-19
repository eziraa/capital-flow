import { UserRole } from "@prisma/client";
import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password must be 200 characters or fewer");

const role = z.enum(UserRole, { error: "Select a valid role" });

export const createUserSchema = z.object({ name, email, password, role });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().min(1, "Missing user id"),
  name,
  email,
  role,
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const setUserPasswordSchema = z.object({
  id: z.string().min(1, "Missing user id"),
  password,
});
export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;

export const userIdSchema = z.object({ id: z.string().min(1, "Missing user id") });
export type UserIdInput = z.infer<typeof userIdSchema>;
