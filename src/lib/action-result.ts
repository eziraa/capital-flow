/**
 * The structured result every Server Action returns. Callers on the client
 * always get a typed success/failure shape instead of a thrown exception
 * crossing the server/client boundary.
 */
export type ActionError =
  | { kind: "UNAUTHENTICATED"; message: string }
  | { kind: "FORBIDDEN"; message: string }
  | { kind: "VALIDATION"; message: string; fieldErrors: Record<string, string[]> }
  | { kind: "NOT_FOUND"; message: string }
  | { kind: "CONFLICT"; message: string }
  | { kind: "UNKNOWN"; message: string };

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function unauthenticated(message = "You must be signed in to do this."): ActionResult<never> {
  return { ok: false, error: { kind: "UNAUTHENTICATED", message } };
}

export function forbidden(message = "You do not have permission to do this."): ActionResult<never> {
  return { ok: false, error: { kind: "FORBIDDEN", message } };
}

export function notFound(message = "The requested record could not be found."): ActionResult<never> {
  return { ok: false, error: { kind: "NOT_FOUND", message } };
}

export function conflict(message: string): ActionResult<never> {
  return { ok: false, error: { kind: "CONFLICT", message } };
}

export function validationError(
  fieldErrors: Record<string, string[]>,
  message = "Please fix the highlighted fields.",
): ActionResult<never> {
  return { ok: false, error: { kind: "VALIDATION", message, fieldErrors } };
}

export function unknownError(message = "Something went wrong. Please try again."): ActionResult<never> {
  return { ok: false, error: { kind: "UNKNOWN", message } };
}

/**
 * Lets code inside a `prisma.$transaction` callback abort with a specific,
 * already-built `ActionResult` — throwing rolls the transaction back, and
 * the caller unwraps `.result` to return it instead of a generic failure.
 */
export class ActionFlowError extends Error {
  constructor(public readonly result: ActionResult<never>) {
    super("ActionFlowError");
  }
}
