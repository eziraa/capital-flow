"use client";

import Link from "next/link";
import useSWR from "swr";
import type { UserRole } from "@prisma/client";

import { listOpportunities } from "@/actions/opportunities";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { OpportunityTable } from "@/components/opportunities/OpportunityTable";
import { buttonClassName } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { canCreateOpportunity } from "@/lib/permissions";
import { useOpportunityListQuery } from "@/lib/use-opportunity-list-query";

export function OpportunitiesListClient({ role }: { role: UserRole }) {
  const { query, update } = useOpportunityListQuery();

  const { data: result, error, isLoading, mutate } = useSWR(
    ["opportunities", query],
    () => listOpportunities(query),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg">Opportunities</h1>
          <p className="text-sm text-muted">Track funding opportunities submitted by companies.</p>
        </div>
        {canCreateOpportunity(role) ? (
          <Link href="/opportunities/new" className={buttonClassName("primary")}>
            New opportunity
          </Link>
        ) : null}
      </div>

      <OpportunityFilters query={query} onChange={(patch) => update(patch, { resetPage: true })} />

      {isLoading ? <TableSkeleton /> : null}

      {error || (result && !result.ok) ? (
        <ErrorState
          message={result && !result.ok ? result.error.message : "Could not load opportunities."}
          onRetry={() => mutate()}
        />
      ) : null}

      {result && result.ok && result.data.items.length === 0 ? (
        <EmptyState
          title="No opportunities match these filters"
          description="Try a different search term, stage, or archive filter."
        />
      ) : null}

      {result && result.ok && result.data.items.length > 0 ? (
        <>
          <OpportunityTable
            items={result.data.items}
            query={query}
            onSort={(field) =>
              update(
                { sort: field, dir: query.sort === field && query.dir === "desc" ? "asc" : "desc" },
                { resetPage: true },
              )
            }
          />
          <Pagination
            page={result.data.page}
            pageCount={result.data.pageCount}
            onPageChange={(page) => update({ page })}
          />
        </>
      ) : null}
    </div>
  );
}
