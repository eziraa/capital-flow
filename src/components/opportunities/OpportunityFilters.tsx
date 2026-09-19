"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Stage } from "@prisma/client";

import { STAGE_LABELS } from "@/components/ui/status-badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OpportunityListQuery } from "@/lib/validation/opportunity-query";

export function OpportunityFilters({
  query,
  onChange,
}: {
  query: OpportunityListQuery;
  onChange: (patch: Partial<OpportunityListQuery>) => void;
}) {
  const [searchDraft, setSearchDraft] = useState(query.q);

  // Keep the input in sync if the URL changes from elsewhere (back/forward
  // nav). Adjusting state during render (rather than in an effect) avoids an
  // extra commit — see https://react.dev/learn/you-might-not-need-an-effect.
  const [syncedQ, setSyncedQ] = useState(query.q);
  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setSearchDraft(query.q);
  }

  useEffect(() => {
    if (searchDraft === query.q) return;
    const timeout = setTimeout(() => onChange({ q: searchDraft }), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <Label htmlFor="opportunity-search">Search company</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="opportunity-search"
            type="search"
            placeholder="e.g. Acme Robotics"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-stage">Stage</Label>
        <Select
          value={query.stage}
          onValueChange={(value) => onChange({ stage: value as OpportunityListQuery["stage"] })}
        >
          <SelectTrigger id="opportunity-stage" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {Object.values(Stage).map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-archived">Show</Label>
        <Select
          value={query.archived}
          onValueChange={(value) => onChange({ archived: value as OpportunityListQuery["archived"] })}
        >
          <SelectTrigger id="opportunity-archived" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
