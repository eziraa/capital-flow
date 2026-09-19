"use client";

import { setUserPasswordFormAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";

/**
 * Fully controlled — no built-in trigger. This is opened from a
 * DropdownMenuItem, and nesting a DialogTrigger inside a dropdown item is a
 * known Radix pitfall (the menu unmounts before the dialog's open state
 * settles), so the parent owns `open` and toggles it directly instead.
 */
export function SetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, formAction } = useActionFeedback(setUserPasswordFormAction, {
    successMessage: "Password updated.",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{userName} will need to sign in with this new password.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <input type="hidden" name="id" value={userId} />
          <FormField
            id="new-password"
            label="New password"
            error={fieldError(state, "password")}
            hint="At least 8 characters."
          >
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!fieldError(state, "password")}
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Saving…">Update password</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
