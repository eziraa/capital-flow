"use client";

import { useActionState, useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

type FormAction<T> = (
  prevState: ActionResult<T> | null,
  formData: FormData,
) => Promise<ActionResult<T>>;

/**
 * Wraps a "form action" adapter (see `actions/*.ts`) with `useActionState`
 * and turns its result into a toast: success or non-validation failure. Field
 * -level validation errors are left for the form to render inline instead.
 */
export function useActionFeedback<T>(
  action: FormAction<T>,
  options?: { successMessage?: string; onSuccess?: (data: T) => void },
) {
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<ActionResult<T> | null, FormData>(
    action,
    null,
  );
  const lastHandled = useRef<ActionResult<T> | null>(null);

  useEffect(() => {
    if (!state || state === lastHandled.current) return;
    lastHandled.current = state;

    if (state.ok) {
      showToast("success", options?.successMessage ?? "Saved.");
      options?.onSuccess?.(state.data);
    } else if (state.error.kind !== "VALIDATION") {
      showToast("error", state.error.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return { state, formAction, isPending };
}

export function fieldError<T>(state: ActionResult<T> | null | undefined, field: string): string | undefined {
  if (state && !state.ok && state.error.kind === "VALIDATION") {
    return state.error.fieldErrors[field]?.[0];
  }
  return undefined;
}
