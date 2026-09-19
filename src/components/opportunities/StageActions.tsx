"use client";

import type { Stage } from "@prisma/client";

import { changeOpportunityStageFormAction } from "@/actions/stage";
import { STAGE_LABELS } from "@/components/ui/Badge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { allowedNextStages } from "@/lib/stage-machine";
import { useActionFeedback } from "@/lib/use-action-feedback";

function StageTransitionForm({
  opportunityId,
  targetStage,
  onChanged,
}: {
  opportunityId: string;
  targetStage: Stage;
  onChanged: () => void;
}) {
  const { formAction } = useActionFeedback(changeOpportunityStageFormAction, {
    successMessage: `Stage changed to ${STAGE_LABELS[targetStage]}.`,
    onSuccess: onChanged,
  });

  const variant = targetStage === "REJECTED" ? "danger" : "primary";

  return (
    <form action={formAction}>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <input type="hidden" name="stage" value={targetStage} />
      <SubmitButton variant={variant} pendingLabel="Updating…">
        Move to {STAGE_LABELS[targetStage]}
      </SubmitButton>
    </form>
  );
}

export function StageActions({
  opportunityId,
  currentStage,
  onChanged,
}: {
  opportunityId: string;
  currentStage: Stage;
  onChanged: () => void;
}) {
  const nextStages = allowedNextStages(currentStage);

  if (nextStages.length === 0) {
    return <p className="text-sm text-muted">No further stage transitions are available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {nextStages.map((stage) => (
        <StageTransitionForm
          key={stage}
          opportunityId={opportunityId}
          targetStage={stage}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
