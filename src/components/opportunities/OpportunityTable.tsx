import Link from "next/link";

import { ArchivedBadge, StageBadge } from "@/components/ui/Badge";
import { formatAmount, formatDate } from "@/lib/format";
import type { OpportunityListItem } from "@/lib/dto";
import type { OpportunityListQuery } from "@/lib/validation/opportunity-query";

type SortableField = OpportunityListQuery["sort"];

const COLUMNS: { field: SortableField; label: string }[] = [
  { field: "submissionDate", label: "Submitted" },
  { field: "requestedAmount", label: "Requested amount" },
];

export function OpportunityTable({
  items,
  query,
  onSort,
}: {
  items: OpportunityListItem[];
  query: OpportunityListQuery;
  onSort: (field: SortableField) => void;
}) {
  function sortIndicator(field: SortableField) {
    if (query.sort !== field) return null;
    return <span aria-hidden="true">{query.dir === "asc" ? " ↑" : " ↓"}</span>;
  }

  function sortButtonProps(field: SortableField) {
    return {
      type: "button" as const,
      onClick: () => onSort(field),
      "aria-sort": (query.sort === field
        ? query.dir === "asc"
          ? "ascending"
          : "descending"
        : "none") as React.AriaAttributes["aria-sort"],
      className: "flex items-center gap-1 font-medium text-fg hover:text-accent",
    };
  }

  return (
    <>
      {/* Desktop / tablet: table layout */}
      <div className="hidden overflow-x-auto rounded-md border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                Company
              </th>
              <th scope="col" className="px-4 py-3">
                Stage
              </th>
              {COLUMNS.map((col) => (
                <th key={col.field} scope="col" className="px-4 py-3">
                  <button {...sortButtonProps(col.field)}>
                    {col.label}
                    {sortIndicator(col.field)}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                Reviewer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-bg">
                <td className="px-4 py-3">
                  <Link
                    href={`/opportunities/${item.id}`}
                    className="font-medium text-fg hover:text-accent hover:underline"
                  >
                    {item.companyName}
                  </Link>
                  {item.archivedAt ? <span className="ml-2 align-middle"><ArchivedBadge /></span> : null}
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={item.stage} />
                </td>
                <td className="px-4 py-3 text-muted-fg">{formatDate(item.submissionDate)}</td>
                <td className="px-4 py-3 text-muted-fg">{formatAmount(item.requestedAmount, item.currency)}</td>
                <td className="px-4 py-3 text-muted-fg">{item.reviewer?.name ?? "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards instead of a cramped table */}
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-border bg-surface p-4">
            <Link href={`/opportunities/${item.id}`} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-fg">{item.companyName}</span>
                <StageBadge stage={item.stage} />
              </div>
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-muted-fg">
                <dt className="text-muted">Submitted</dt>
                <dd>{formatDate(item.submissionDate)}</dd>
                <dt className="text-muted">Amount</dt>
                <dd>{formatAmount(item.requestedAmount, item.currency)}</dd>
                <dt className="text-muted">Reviewer</dt>
                <dd>{item.reviewer?.name ?? "Unassigned"}</dd>
              </dl>
              {item.archivedAt ? <ArchivedBadge /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
