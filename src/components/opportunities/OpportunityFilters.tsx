"use client";

import { useEffect, useState } from "react";
import { Stage } from "@prisma/client";

import { STAGE_LABELS } from "@/components/ui/Badge";
import { inputClassName } from "@/components/ui/Field";
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
        <label htmlFor="opportunity-search" className="text-sm font-medium text-fg">
          Search company
        </label>
        <input
          id="opportunity-search"
          type="search"
          placeholder="e.g. Acme Robotics"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="opportunity-stage" className="text-sm font-medium text-fg">
          Stage
        </label>
        <select
          id="opportunity-stage"
          value={query.stage}
          onChange={(e) => onChange({ stage: e.target.value as OpportunityListQuery["stage"] })}
          className={inputClassName()}
        >
          <option value="ALL">All stages</option>
          {Object.values(Stage).map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="opportunity-archived" className="text-sm font-medium text-fg">
          Show
        </label>
        <select
          id="opportunity-archived"
          value={query.archived}
          onChange={(e) => onChange({ archived: e.target.value as OpportunityListQuery["archived"] })}
          className={inputClassName()}
        >
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="ALL">All</option>
        </select>
      </div>
    </div>
  );
}
