"use client";

import { useState } from "react";
import useSWR from "swr";
import { ActivityType } from "@prisma/client";
import Link from "next/link";

import { listActivityLog, exportActivityCsv, type AuditLogQuery } from "@/actions/audit-log";
import { ExportActivityButton } from "@/components/dashboard/ExportActivityButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OpportunityPagination } from "@/components/opportunities/OpportunityPagination";
import { describeActivity } from "@/lib/activity-description";
import { formatDateTime } from "@/lib/format";

const TYPE_LABELS: Record<ActivityType, string> = {
  CREATED: "Created",
  STAGE_CHANGED: "Stage changed",
  REVIEWER_ASSIGNED: "Reviewer assigned",
  COMMENT_ADDED: "Comment added",
  ARCHIVED: "Archived",
  RESTORED: "Restored",
};

const TYPE_VARIANT: Record<ActivityType, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  CREATED: "success",
  STAGE_CHANGED: "warning",
  REVIEWER_ASSIGNED: "secondary",
  COMMENT_ADDED: "outline",
  ARCHIVED: "destructive",
  RESTORED: "default",
};

export function AuditLogClient() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const query: AuditLogQuery = {
    page,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data: result, isLoading, error, mutate } = useSWR(
    ["audit-log", query],
    () => listActivityLog(query),
  );

  function buildHref(patch: { page: number }) {
    setPage(patch.page);
    return "#";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Full append-only activity history across all opportunities. Admin only.
          </p>
        </div>
        <ExportActivityButton />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-type">Activity type</Label>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as ActivityType | "ALL"); setPage(1); }}>
            <SelectTrigger id="audit-type" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {Object.values(ActivityType).map((t) => (
                <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-date-from">From date</Label>
          <Input
            id="audit-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-[155px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-date-to">To date</Label>
          <Input
            id="audit-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-[155px]"
          />
        </div>
      </div>

      {isLoading ? <TableSkeleton cols={5} /> : null}
      {error || (result && !result.ok) ? (
        <ErrorState
          message={result && !result.ok ? result.error.message : "Could not load audit log."}
          onRetry={() => mutate()}
        />
      ) : null}
      {result?.ok && result.data.items.length === 0 ? (
        <EmptyState title="No activity matches these filters" description="Try adjusting the type or date range." />
      ) : null}

      {result?.ok && result.data.items.length > 0 ? (
        <>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/opportunities/${item.opportunityId}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {item.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[item.type]}>{TYPE_LABELS[item.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.actor.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {describeActivity(item)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <OpportunityPagination
            page={result.data.page}
            pageCount={result.data.pageCount}
            buildHref={(patch) => {
              setPage(patch.page);
              return "#";
            }}
          />
        </>
      ) : null}
    </div>
  );
}
