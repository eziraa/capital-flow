import type { ZodError } from "zod";

/** Converts a ZodError into the flat `{ field: message[] }` shape the UI renders next to inputs. */
export function fieldErrorsFrom<T>(error: ZodError<T>): Record<string, string[]> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const result: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(flat)) {
    if (messages && messages.length > 0) {
      result[field] = messages;
    }
  }

  return result;
}
