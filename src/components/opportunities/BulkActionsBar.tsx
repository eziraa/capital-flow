"use client";

import { Archive, X } from "lucide-react";
import { toast } from "sonner";

import { bulkArchiveOpportunities } from "@/actions/archive";
import { Button } from "@/components/ui/button";

export function BulkActionsBar({
  selectedIds,
  onClear,
  onDone,
}: {
  selectedIds: string[];
  onClear: () => void;
  onDone: () => void;
}) {
  if (selectedIds.length === 0) return null;

  async function handleBulkArchive() {
    const result = await bulkArchiveOpportunities(selectedIds);
    if (result.ok) {
      toast.success(
        `${result.data.count} ${result.data.count === 1 ? "opportunity" : "opportunities"} archived.`,
      );
      onClear();
      onDone();
    } else {
      toast.error(result.error.message);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-2.5">
      <span className="text-sm font-medium text-foreground">
        {selectedIds.length} selected
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" onClick={handleBulkArchive}>
          <Archive className="size-3.5" />
          Archive selected
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} aria-label="Clear selection">
          <X className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
