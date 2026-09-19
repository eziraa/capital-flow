"use client";

import { useRef } from "react";
import type { Stage } from "@prisma/client";

import { changeOpportunityStageFormAction } from "@/actions/stage";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STAGE_LABELS } from "@/components/ui/status-badges";
import { SubmitButton } from "@/components/ui/submit-button";
import { allowedNextStages } from "@/lib/stage-machine";
import { useActionFeedback } from "@/lib/use-action-feedback";

/** Terminal stages that benefit most from an explicit rationale. */
const RATIONALE_STAGES: Stage[] = ["APPROVED", "REJECTED"];

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

  const rationaleRef = useRef<HTMLTextAreaElement>(null);
  const askRationale = RATIONALE_STAGES.includes(targetStage);
  const variant = targetStage === "REJECTED" ? "destructive" : "default";
  const label = `Move to ${STAGE_LABELS[targetStage]}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This records a stage-change activity entry and can&apos;t be undone directly — moving
            it back would be a separate, equally logged change.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction}>
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <input type="hidden" name="stage" value={targetStage} />

          {askRationale ? (
            <div className="mb-4 flex flex-col gap-1.5">
              <Label htmlFor={`rationale-${targetStage}`}>
                Rationale{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id={`rationale-${targetStage}`}
                name="rationale"
                ref={rationaleRef}
                placeholder={
                  targetStage === "APPROVED"
                    ? "Why is this opportunity approved?"
                    : "Why is this opportunity rejected?"
                }
                maxLength={1000}
                rows={3}
                className="resize-none"
              />
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <SubmitButton variant={variant} pendingLabel="Updating…">
                {label}
              </SubmitButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
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
    return <p className="text-sm text-muted-foreground">No further stage transitions are available.</p>;
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
