"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { parseOpportunityListQuery, type OpportunityListQuery } from "@/lib/validation/opportunity-query";

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

  const update = useCallback(
    (patch: Partial<OpportunityListQuery>, options?: { resetPage?: boolean }) => {
      const merged: OpportunityListQuery = {
        ...query,
        ...patch,
        ...(options?.resetPage ? { page: 1 } : {}),
      };

      const next = new URLSearchParams();
      next.set("q", merged.q);
      next.set("stage", merged.stage);
      next.set("archived", merged.archived);
      next.set("sort", merged.sort);
      next.set("dir", merged.dir);
      next.set("page", String(merged.page));

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, query],
  );

  return { query, update };
}
