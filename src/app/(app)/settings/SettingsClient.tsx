"use client";

import { updateMyPasswordFormAction, updateMyProfileFormAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { fieldError, useActionFeedback } from "@/lib/use-action-feedback";

export function SettingsClient({ user }: { user: { name: string | null; email: string | null } }) {
  const profileFeedback = useActionFeedback(updateMyProfileFormAction, {
    successMessage: "Profile updated. Refresh the page to see changes everywhere.",
  });

  const passwordFeedback = useActionFeedback(updateMyPasswordFormAction, {
    successMessage: "Password updated successfully.",
    onSuccess: () => {
      if (typeof window !== "undefined") {
         (document.getElementById("password-form") as HTMLFormElement)?.reset();
      }
    },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileFeedback.formAction} className="flex flex-col gap-4">
            <FormField id="email" label="Email address">
              <Input id="email" type="email" value={user.email!} disabled />
              <p className="mt-1 text-xs text-muted-foreground">Contact an admin to change your email.</p>
            </FormField>
            
            <FormField id="name" label="Full name" error={fieldError(profileFeedback.state, "name")}>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
                required
                autoComplete="name"
                aria-invalid={!!fieldError(profileFeedback.state, "name")}
              />
            </FormField>

            <div className="flex justify-end">
              <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" action={passwordFeedback.formAction} className="flex flex-col gap-4">
            <FormField id="currentPassword" label="Current password" error={fieldError(passwordFeedback.state, "currentPassword")}>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                aria-invalid={!!fieldError(passwordFeedback.state, "currentPassword")}
              />
            </FormField>

            <FormField id="newPassword" label="New password" error={fieldError(passwordFeedback.state, "newPassword")}>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                aria-invalid={!!fieldError(passwordFeedback.state, "newPassword")}
              />
            </FormField>

            <div className="flex justify-end">
              <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
