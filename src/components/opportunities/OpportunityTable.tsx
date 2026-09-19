import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ArchivedBadge, StageBadge } from "@/components/ui/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    const Icon = query.dir === "asc" ? ArrowUp : ArrowDown;
    return <Icon className="size-3.5" aria-hidden="true" />;
  }

  function sortAria(field: SortableField): React.AriaAttributes["aria-sort"] {
    if (query.sort !== field) return "none";
    return query.dir === "asc" ? "ascending" : "descending";
  }

  return (
    <>
      {/* Desktop / tablet: table layout */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.field} aria-sort={sortAria(col.field)}>
                  <button
                    type="button"
                    onClick={() => onSort(col.field)}
                    className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    {col.label}
                    {sortIndicator(col.field)}
                  </button>
                </TableHead>
              ))}
              <TableHead>Reviewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/opportunities/${item.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {item.companyName}
                  </Link>
                  {item.archivedAt ? (
                    <span className="ml-2 align-middle">
                      <ArchivedBadge />
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <StageBadge stage={item.stage} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.submissionDate)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatAmount(item.requestedAmount, item.currency)}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.reviewer?.name ?? "Unassigned"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: stacked cards instead of a cramped table */}
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="p-4">
              <Link href={`/opportunities/${item.id}`} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{item.companyName}</span>
                  <StageBadge stage={item.stage} />
                </div>
                <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <dt className="text-muted-foreground/70">Submitted</dt>
                  <dd>{formatDate(item.submissionDate)}</dd>
                  <dt className="text-muted-foreground/70">Amount</dt>
                  <dd>{formatAmount(item.requestedAmount, item.currency)}</dd>
                  <dt className="text-muted-foreground/70">Reviewer</dt>
                  <dd>{item.reviewer?.name ?? "Unassigned"}</dd>
                </dl>
                {item.archivedAt ? <ArchivedBadge /> : null}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
