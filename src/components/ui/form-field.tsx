import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

/**
 * A plain Label + control + error-message wrapper. shadcn's own `Form`
 * component is built around react-hook-form, which this app doesn't use —
 * every mutation here is a Server Action read through `useActionState`, so
 * validation errors come back from the server, not client-side field state.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
