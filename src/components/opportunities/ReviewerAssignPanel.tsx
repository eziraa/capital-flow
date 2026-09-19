"use client";

import { assignReviewerFormAction } from "@/actions/reviewers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionFeedback } from "@/lib/use-action-feedback";
import type { ReviewerOption } from "@/actions/reviewers";

export const UNASSIGNED_VALUE = "unassigned";

export function ReviewerAssignPanel({
  opportunityId,
  currentReviewerId,
  reviewers,
  onAssigned,
}: {
  opportunityId: string;
  currentReviewerId: string | null;
  reviewers: ReviewerOption[];
  onAssigned: () => void;
}) {
  const { formAction } = useActionFeedback(assignReviewerFormAction, {
    successMessage: "Reviewer updated.",
    onSuccess: onAssigned,
  });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="flex min-w-[180px] flex-col gap-1.5">
        <label htmlFor="reviewerId" className="text-sm font-medium text-foreground">
          Reviewer
        </label>
        <Select
          key={currentReviewerId ?? UNASSIGNED_VALUE}
          name="reviewerId"
          defaultValue={currentReviewerId ?? UNASSIGNED_VALUE}
        >
          <SelectTrigger id="reviewerId" className="w-full min-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {reviewers.map((reviewer) => (
              <SelectItem key={reviewer.id} value={reviewer.id}>
                {reviewer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SubmitButton variant="outline" pendingLabel="Saving…">
        Update reviewer
      </SubmitButton>
    </form>
  );
}
