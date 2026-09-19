"use client";

import Link from "next/link";
import useSWR from "swr";

import { getDashboardSummary, type DashboardSummary } from "@/actions/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { STAGE_LABELS, StageBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/States";
import { formatAmount, formatDate } from "@/lib/format";
import type { ActionResult } from "@/lib/action-result";

export function DashboardClient({ initial }: { initial: ActionResult<DashboardSummary> }) {
  const { data: result, mutate } = useSWR(["dashboard"], () => getDashboardSummary(), {
    fallbackData: initial,
  });

  if (!result.ok) {
    return <ErrorState message={result.error.message} onRetry={() => mutate()} />;
  }

  const { totalActive, stageCounts, amountByCurrency, recentOpportunities, reviewerWorkload } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-fg">Dashboard</h1>
        <p className="text-sm text-muted">An overview of active funding opportunities.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active opportunities" value={String(totalActive)} />
        {Object.entries(stageCounts).map(([stage, count]) => (
          <StatCard key={stage} label={STAGE_LABELS[stage as keyof typeof STAGE_LABELS]} value={String(count)} />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-fg">Requested amount by currency</h2>
        {amountByCurrency.length === 0 ? (
          <p className="text-sm text-muted">No active opportunities yet.</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {amountByCurrency.map((entry) => (
              <div key={entry.currency}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{entry.currency}</p>
                <p className="text-lg font-semibold text-fg">{formatAmount(entry.total, entry.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-fg">Recently submitted</h2>
          {recentOpportunities.length === 0 ? (
            <p className="text-sm text-muted">No active opportunities yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentOpportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="text-sm font-medium text-fg hover:text-accent hover:underline"
                    >
                      {opportunity.companyName}
                    </Link>
                    <p className="text-xs text-muted">{formatDate(opportunity.submissionDate)}</p>
                  </div>
                  <StageBadge stage={opportunity.stage} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-fg">Reviewer workload</h2>
          {reviewerWorkload.length === 0 ? (
            <p className="text-sm text-muted">No reviewers found.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {reviewerWorkload.map((reviewer) => (
                <li key={reviewer.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-fg">{reviewer.name}</span>
                  <span className="text-sm text-muted-fg">{reviewer.activeCount} active</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
