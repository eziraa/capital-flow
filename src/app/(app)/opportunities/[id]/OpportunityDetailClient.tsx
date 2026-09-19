"use client";

import { ArrowLeft, Info, Pencil } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import type { UserRole } from "@prisma/client";

import { listActivity, listComments } from "@/actions/comments";
import { getOpportunity } from "@/actions/opportunities";
import { listReviewers } from "@/actions/reviewers";
import { ActivityTimeline } from "@/components/opportunities/ActivityTimeline";
import { ArchiveControls } from "@/components/opportunities/ArchiveControls";
import { CommentsSection } from "@/components/opportunities/CommentsSection";
import { OpportunityFormDialog } from "@/components/opportunities/OpportunityFormDialog";
import { ReviewerAssignPanel } from "@/components/opportunities/ReviewerAssignPanel";
import { StageActions } from "@/components/opportunities/StageActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import { ArchivedBadge, StageBadge } from "@/components/ui/status-badges";
import { formatAmount, formatDate, formatDateTime, toDateInputValue } from "@/lib/format";
import {
  canAssignReviewer,
  canArchiveOrRestore,
  canChangeStage,
  canComment,
  canEditOpportunity,
} from "@/lib/permissions";
import type { OpportunityDetail } from "@/lib/dto";

export function OpportunityDetailClient({
  id,
  role,
  initial,
}: {
  id: string;
  role: UserRole;
  initial: OpportunityDetail;
}) {
  const {
    data: opportunityResult,
    mutate: mutateOpportunity,
  } = useSWR(["opportunity", id], () => getOpportunity(id), {
    fallbackData: { ok: true as const, data: initial },
  });

  const { data: commentsResult, mutate: mutateComments } = useSWR(["opportunity-comments", id], () =>
    listComments(id),
  );

  const { data: activityResult, mutate: mutateActivity } = useSWR(["opportunity-activity", id], () =>
    listActivity(id),
  );

  const { data: reviewersResult } = useSWR(canAssignReviewer(role) ? ["reviewers"] : null, () =>
    listReviewers(),
  );

  if (!opportunityResult?.ok) {
    return (
      <ErrorState
        message={opportunityResult?.error.message ?? "Could not load this opportunity."}
        onRetry={() => mutateOpportunity()}
      />
    );
  }

  const opportunity = opportunityResult.data;
  const isArchived = !!opportunity.archivedAt;

  function refreshAfterMutation() {
    mutateOpportunity();
    mutateActivity();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to opportunities
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{opportunity.companyName}</h1>
            <StageBadge stage={opportunity.stage} />
            {isArchived ? <ArchivedBadge /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatDate(opportunity.submissionDate)} by {opportunity.createdBy.name}
          </p>
        </div>

        {canEditOpportunity(role) && !isArchived ? (
          <OpportunityFormDialog
            mode="edit"
            opportunityId={id}
            title="Edit opportunity"
            description={opportunity.companyName}
            initial={{
              companyName: opportunity.companyName,
              requestedAmount: String(opportunity.requestedAmount),
              currency: opportunity.currency,
              submissionDate: toDateInputValue(opportunity.submissionDate),
              description: opportunity.description,
            }}
            trigger={
              <Button variant="outline">
                <Pencil />
                Edit details
              </Button>
            }
            onSaved={() => mutateOpportunity()}
          />
        ) : null}
      </div>

      {isArchived ? (
        <Alert>
          <Info />
          <AlertDescription>
            This opportunity is archived. Restore it to edit, change its stage, or add comments.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <DetailField
            label="Requested amount"
            value={formatAmount(opportunity.requestedAmount, opportunity.currency)}
          />
          <DetailField label="Currency" value={opportunity.currency} />
          <DetailField label="Submission date" value={formatDate(opportunity.submissionDate)} />
          <DetailField label="Reviewer" value={opportunity.reviewer?.name ?? "Unassigned"} />
          <DetailField
            label="Created"
            value={`${formatDateTime(opportunity.createdAt)} by ${opportunity.createdBy.name}`}
          />
          <DetailField label="Last updated" value={formatDateTime(opportunity.updatedAt)} />
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{opportunity.description}</p>
          </div>
        </CardContent>
      </Card>

      {canAssignReviewer(role) && !isArchived ? (
        <Section title="Reviewer assignment">
          {reviewersResult?.ok ? (
            <ReviewerAssignPanel
              opportunityId={id}
              currentReviewerId={opportunity.reviewer?.id ?? null}
              reviewers={reviewersResult.data}
              onAssigned={refreshAfterMutation}
            />
          ) : (
            <CardSkeleton lines={1} />
          )}
        </Section>
      ) : null}

      {canChangeStage(role) && !isArchived ? (
        <Section title="Change stage">
          <StageActions opportunityId={id} currentStage={opportunity.stage} onChanged={refreshAfterMutation} />
        </Section>
      ) : null}

      <Section title="Comments">
        {commentsResult?.ok ? (
          <CommentsSection
            opportunityId={id}
            comments={commentsResult.data}
            canAddComment={canComment(role)}
            disabled={isArchived}
            onCommentAdded={() => {
              mutateComments();
              mutateActivity();
            }}
          />
        ) : (
          <CardSkeleton lines={2} />
        )}
      </Section>

      <Section title="Activity">
        {activityResult?.ok ? (
          <ActivityTimeline activities={activityResult.data} />
        ) : (
          <CardSkeleton lines={4} />
        )}
      </Section>

      {canArchiveOrRestore(role) ? (
        <Section title="Danger zone">
          <ArchiveControls opportunityId={id} isArchived={isArchived} onChanged={refreshAfterMutation} />
        </Section>
      ) : null}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
