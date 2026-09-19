"use client";

import { Briefcase, History, Users, Wallet } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import type { UserRole } from "@prisma/client";

import { getDashboardSummary, type DashboardSummary } from "@/actions/dashboard";
import { ExportActivityButton } from "@/components/dashboard/ExportActivityButton";
import { StageBarChart } from "@/components/dashboard/StageBarChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { SubmissionTrendChart } from "@/components/dashboard/SubmissionTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/states";
import { STAGE_ICONS, STAGE_LABELS, STAGE_TONE, StageBadge } from "@/components/ui/status-badges";
import { formatAmount, formatDate } from "@/lib/format";
import { canExportActivity } from "@/lib/permissions";
import type { ActionResult } from "@/lib/action-result";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CardTitleWithIcon({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      {children}
    </CardTitle>
  );
}

export function DashboardClient({ initial, role }: { initial: ActionResult<DashboardSummary>; role: UserRole }) {
  const { data: result, mutate } = useSWR(["dashboard"], () => getDashboardSummary(), {
    fallbackData: initial,
  });

  if (!result.ok) {
    return <ErrorState message={result.error.message} onRetry={() => mutate()} />;
  }

  const { totalActive, stageCounts, amountByCurrency, recentOpportunities, reviewerWorkload, submissionsTrend } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">An overview of active funding opportunities.</p>
        </div>
        {canExportActivity(role) ? <ExportActivityButton /> : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active opportunities" value={String(totalActive)} icon={Briefcase} />
        {Object.entries(stageCounts).map(([stage, count]) => (
          <StatCard
            key={stage}
            label={STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
            value={String(count)}
            icon={STAGE_ICONS[stage as keyof typeof STAGE_ICONS]}
            tone={STAGE_TONE[stage as keyof typeof STAGE_TONE]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StageBarChart data={stageCounts} />
        <SubmissionTrendChart data={submissionsTrend} />
      </div>

      <Card>
        <CardHeader>
          <CardTitleWithIcon icon={Wallet}>Requested amount by currency</CardTitleWithIcon>
        </CardHeader>
        <CardContent>
          {amountByCurrency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active opportunities yet.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {amountByCurrency.map((entry) => (
                <div key={entry.currency}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.currency}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatAmount(entry.total, entry.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleWithIcon icon={History}>Recently submitted</CardTitleWithIcon>
          </CardHeader>
          <CardContent>
            {recentOpportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active opportunities yet.</p>
            ) : (
              <ul className="flex flex-col">
                {recentOpportunities.map((opportunity, index) => (
                  <li key={opportunity.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <Link
                          href={`/opportunities/${opportunity.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {opportunity.companyName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(opportunity.submissionDate)}
                        </p>
                      </div>
                      <StageBadge stage={opportunity.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitleWithIcon icon={Users}>Reviewer workload</CardTitleWithIcon>
          </CardHeader>
          <CardContent>
            {reviewerWorkload.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviewers found.</p>
            ) : (
              <ul className="flex flex-col">
                {reviewerWorkload.map((reviewer, index) => (
                  <li key={reviewer.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                          aria-hidden="true"
                        >
                          {initials(reviewer.name)}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">{reviewer.name}</span>
                      </div>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {reviewer.activeCount} active
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
