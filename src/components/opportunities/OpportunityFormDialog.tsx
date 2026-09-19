"use client";

import { useState, type ReactNode } from "react";

import { OpportunityForm, type OpportunityFormValues } from "@/components/opportunities/OpportunityForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OpportunityFormDialog({
  mode,
  opportunityId,
  initial,
  trigger,
  title,
  description,
  onSaved,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  mode: "create" | "edit";
  opportunityId?: string;
  initial?: OpportunityFormValues;
  /** Omit when the dialog is controlled entirely by `open`/`onOpenChange`. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  /** Called after a successful save, once the dialog has already closed. */
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <OpportunityForm
          mode={mode}
          opportunityId={opportunityId}
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
