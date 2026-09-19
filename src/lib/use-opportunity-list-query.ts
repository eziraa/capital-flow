"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { parseOpportunityListQuery, type OpportunityListQuery } from "@/lib/validation/opportunity-query";

function toSearchParams(query: OpportunityListQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("q", query.q);
  params.set("stage", query.stage);
  params.set("archived", query.archived);
  params.set("sort", query.sort);
  params.set("dir", query.dir);
  params.set("page", String(query.page));
  params.set("currency", query.currency);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.amountMin !== undefined) params.set("amountMin", String(query.amountMin));
  if (query.amountMax !== undefined) params.set("amountMax", String(query.amountMax));
  return params;
}

/**
 * The single source of truth for the opportunities list's search, filter,
 * sort, and pagination state — the URL. Reading always goes through the
 * same validation the server uses, and every update rewrites the full query
 * string so the page stays refreshable and shareable.
 */
export function useOpportunityListQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => parseOpportunityListQuery(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const merge = useCallback(
    (patch: Partial<OpportunityListQuery>, options?: { resetPage?: boolean }): OpportunityListQuery => ({
      ...query,
      ...patch,
      ...(options?.resetPage ? { page: 1 } : {}),
    }),
    [query],
  );

  const update = useCallback(
    (patch: Partial<OpportunityListQuery>, options?: { resetPage?: boolean }) => {
      const params = toSearchParams(merge(patch, options));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, merge],
  );

  /** A real, shareable href for a query patch — used for actual `<Link>` navigation (e.g. pagination). */
  const buildHref = useCallback(
    (patch: Partial<OpportunityListQuery>) => `${pathname}?${toSearchParams(merge(patch)).toString()}`,
    [pathname, merge],
  );

  return { query, update, buildHref };
}
