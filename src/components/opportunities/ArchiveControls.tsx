"use client";

import { archiveOpportunityFormAction, restoreOpportunityFormAction } from "@/actions/archive";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
        <SubmitButton variant="secondary" pendingLabel="Restoring…">
          Restore opportunity
        </SubmitButton>
      </form>
    );
  }

  return (
    <form action={archiveFeedback.formAction}>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <SubmitButton variant="danger" pendingLabel="Archiving…">
        Archive opportunity
      </SubmitButton>
    </form>
  );
}
