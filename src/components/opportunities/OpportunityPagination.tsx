import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/**
 * shadcn's `PaginationLink`/`PaginationPrevious` render a plain `<a>`
 * internally (they're built for framework-agnostic anchors), which would
 * force a full page reload here. This keeps their `Pagination`/
 * `PaginationContent`/`PaginationItem` semantic wrappers and button styling,
 * but renders Next's `<Link>` directly so pagination stays a client-side
 * transition — the list re-fetches through SWR instead of reloading.
 */
export function OpportunityPagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (patch: { page: number }) => string;
}) {
  if (pageCount <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Link
            href={buildHref({ page: Math.max(1, page - 1) })}
            scroll={false}
            aria-label="Go to previous page"
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "gap-1 pl-1.5",
              isFirst && "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeft />
            <span className="hidden sm:block">Previous</span>
          </Link>
        </PaginationItem>

        <PaginationItem>
          <span className="px-2 text-sm text-muted-foreground" aria-live="polite">
            Page {page} of {pageCount}
          </span>
        </PaginationItem>

        <PaginationItem>
          <Link
            href={buildHref({ page: Math.min(pageCount, page + 1) })}
            scroll={false}
            aria-label="Go to next page"
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "gap-1 pr-1.5",
              isLast && "pointer-events-none opacity-50",
            )}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRight />
          </Link>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
