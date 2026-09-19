"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { archiveOpportunityFormAction, restoreOpportunityFormAction } from "@/actions/archive";
import { useActionFeedback } from "@/lib/use-action-feedback";

export function ArchiveControls({
  opportunityId,
  isArchived,
  onChanged,
}: {
  opportunityId: string;
  isArchived: boolean;
  onChanged: () => void;
}) {
  const archiveFeedback = useActionFeedback(archiveOpportunityFormAction, {
    successMessage: "Opportunity archived.",
    onSuccess: onChanged,
  });
  const restoreFeedback = useActionFeedback(restoreOpportunityFormAction, {
    successMessage: "Opportunity restored.",
    onSuccess: onChanged,
  });

  if (isArchived) {
    return (
      <form action={restoreFeedback.formAction}>
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <SubmitButton variant="outline" pendingLabel="Restoring…">
          Restore opportunity
        </SubmitButton>
      </form>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Archive opportunity</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this opportunity?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be hidden from the default list and dashboard totals, and can&apos;t be edited or
            change stage, until an admin restores it. This can be undone at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={archiveFeedback.formAction}>
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <SubmitButton variant="destructive" pendingLabel="Archiving…">
                Archive
              </SubmitButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
