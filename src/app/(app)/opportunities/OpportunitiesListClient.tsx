"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { UserRole } from "@prisma/client";

import { listOpportunities } from "@/actions/opportunities";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { OpportunityFormDialog } from "@/components/opportunities/OpportunityFormDialog";
import { OpportunityPagination } from "@/components/opportunities/OpportunityPagination";
import { OpportunityTable } from "@/components/opportunities/OpportunityTable";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { canCreateOpportunity } from "@/lib/permissions";
import { useOpportunityListQuery } from "@/lib/use-opportunity-list-query";

export function OpportunitiesListClient({ role }: { role: UserRole }) {
  const router = useRouter();
  const { query, update, buildHref } = useOpportunityListQuery();

  const { data: result, error, isLoading, mutate } = useSWR(
    ["opportunities", query],
    () => listOpportunities(query),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Track funding opportunities submitted by companies.
          </p>
        </div>
        {canCreateOpportunity(role) ? (
          <OpportunityFormDialog
            mode="create"
            title="New opportunity"
            description="Record a funding opportunity submitted by a company."
            trigger={
              <Button>
                <Plus />
                New opportunity
              </Button>
            }
            onSaved={(data) => router.push(`/opportunities/${data.id}`)}
          />
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
          <OpportunityPagination
            page={result.data.page}
            pageCount={result.data.pageCount}
            buildHref={buildHref}
          />
        </>
      ) : null}
    </div>
  );
}
