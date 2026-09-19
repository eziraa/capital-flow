"use client";

import { UserRole } from "@prisma/client";

import { createUserFormAction, updateUserFormAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

export type UserFormValues = {
  name: string;
  email: string;
  role: UserRole;
};

export function UserForm({
  mode,
  userId,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  userId?: string;
  initial?: UserFormValues;
  onSuccess?: (data: { id: string }) => void;
  onCancel?: () => void;
}) {
  const action = mode === "create" ? createUserFormAction : updateUserFormAction;
  const { state, formAction } = useActionFeedback(action, {
    successMessage: mode === "create" ? "User created." : "User updated.",
    onSuccess,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {mode === "edit" ? <input type="hidden" name="id" value={userId} /> : null}

      <FormField id="user-name" label="Name" error={fieldError(state, "name")}>
        <Input
          id="user-name"
          name="name"
          type="text"
          defaultValue={initial?.name}
          required
          aria-invalid={!!fieldError(state, "name")}
        />
      </FormField>

      <FormField id="user-email" label="Email" error={fieldError(state, "email")}>
        <Input
          id="user-email"
          name="email"
          type="email"
          defaultValue={initial?.email}
          required
          aria-invalid={!!fieldError(state, "email")}
        />
      </FormField>

      {mode === "create" ? (
        <FormField
          id="user-password"
          label="Password"
          error={fieldError(state, "password")}
          hint="At least 8 characters. The user can sign in with this right away."
        >
          <Input
            id="user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={!!fieldError(state, "password")}
          />
        </FormField>
      ) : null}

      <FormField id="user-role" label="Role" error={fieldError(state, "role")}>
        <Select name="role" defaultValue={initial?.role ?? UserRole.VIEWER}>
          <SelectTrigger id="user-role" className="w-full" aria-invalid={!!fieldError(state, "role")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pendingLabel={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create user" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
