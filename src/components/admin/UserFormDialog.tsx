"use client";

import { useState, type ReactNode } from "react";

import { UserForm, type UserFormValues } from "@/components/admin/UserForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UserFormDialog({
  mode,
  userId,
  initial,
  trigger,
  title,
  description,
  onSaved,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  mode: "create" | "edit";
  userId?: string;
  initial?: UserFormValues;
  /** Omit when the dialog is controlled entirely by `open`/`onOpenChange` (e.g. opened from a dropdown menu item). */
  trigger?: ReactNode;
  title: string;
  description?: string;
  onSaved?: (data: { id: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChangeProp ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <UserForm
          mode={mode}
          userId={userId}
          initial={initial}
          onCancel={() => setOpen(false)}
          onSuccess={(data) => {
            setOpen(false);
            onSaved?.(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
