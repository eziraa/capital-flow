"use client";

import { assignReviewerFormAction } from "@/actions/reviewers";
import { inputClassName } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionFeedback } from "@/lib/use-action-feedback";
import type { ReviewerOption } from "@/actions/reviewers";

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
        <label htmlFor="reviewerId" className="text-sm font-medium text-fg">
          Reviewer
        </label>
        <select
          id="reviewerId"
          name="reviewerId"
          defaultValue={currentReviewerId ?? ""}
          className={inputClassName()}
        >
          <option value="">Unassigned</option>
          {reviewers.map((reviewer) => (
            <option key={reviewer.id} value={reviewer.id}>
              {reviewer.name}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton variant="secondary" pendingLabel="Saving…">
        Update reviewer
      </SubmitButton>
    </form>
  );
}
