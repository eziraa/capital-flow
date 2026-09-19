"use client";

import { MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { disableUserFormAction, enableUser, type UserListItem } from "@/actions/users";
import { SetPasswordDialog } from "@/components/admin/SetPasswordDialog";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionFeedback } from "@/lib/use-action-feedback";

export function UserRowActions({
  user,
  isSelf,
  onChanged,
}: {
  user: UserListItem;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [isEnabling, startEnableTransition] = useTransition();

  const isDisabled = !!user.disabledAt;

  const { formAction: disableFormAction } = useActionFeedback(disableUserFormAction, {
    successMessage: `${user.name} disabled.`,
    onSuccess: () => {
      setDisableOpen(false);
      onChanged();
    },
  });

  function handleEnable() {
    startEnableTransition(async () => {
      const result = await enableUser({ id: user.id });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`${user.name} enabled.`);
      onChanged();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
            <span className="sr-only">Actions for {user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>Reset password</DropdownMenuItem>
          <DropdownMenuSeparator />
          {isDisabled ? (
            <DropdownMenuItem disabled={isEnabling} onSelect={handleEnable}>
              {isEnabling ? "Enabling…" : "Enable"}
            </DropdownMenuItem>
          ) : !isSelf ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setDisableOpen(true)}>
              Disable
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        mode="edit"
        userId={user.id}
        title="Edit user"
        description={user.email}
        initial={{ name: user.name, email: user.email, role: user.role }}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onChanged}
      />

      <SetPasswordDialog userId={user.id} userName={user.name} open={passwordOpen} onOpenChange={setPasswordOpen} />

      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be signed out on their next request and won&apos;t be able to sign back in until
              you re-enable this account. This doesn&apos;t remove anything they&apos;ve already created,
              reviewed, or commented on.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={disableFormAction}>
            <input type="hidden" name="id" value={user.id} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <SubmitButton variant="destructive" pendingLabel="Disabling…">
                  Disable
                </SubmitButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
