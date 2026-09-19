"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Currency, Stage } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGE_LABELS } from "@/components/ui/status-badges";
import type { OpportunityListQuery } from "@/lib/validation/opportunity-query";

const CURRENCY_LABELS: Record<Currency, string> = { USD: "USD", EUR: "EUR", GBP: "GBP" };

/** Returns true if any advanced filter differs from its default */
function hasAdvancedFilters(q: OpportunityListQuery) {
  return (
    q.currency !== "ALL" ||
    !!q.dateFrom ||
    !!q.dateTo ||
    q.amountMin !== undefined ||
    q.amountMax !== undefined
  );
}

const DEFAULT_ADVANCED: Partial<OpportunityListQuery> = {
  currency: "ALL",
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: undefined,
  amountMax: undefined,
};

export function OpportunityFilters({
  query,
  onChange,
}: {
  query: OpportunityListQuery;
  onChange: (patch: Partial<OpportunityListQuery>) => void;
}) {
  const [searchDraft, setSearchDraft] = useState(query.q);

  // Sync search input when the URL changes from back/forward nav
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

  const [amountMinDraft, setAmountMinDraft] = useState(query.amountMin?.toString() ?? "");
  const [amountMaxDraft, setAmountMaxDraft] = useState(query.amountMax?.toString() ?? "");

  // Commit amount range after 500ms pause
  useEffect(() => {
    const min = amountMinDraft ? Number(amountMinDraft) : undefined;
    const max = amountMaxDraft ? Number(amountMaxDraft) : undefined;
    if (min === query.amountMin && max === query.amountMax) return;
    const t = setTimeout(() => onChange({ amountMin: min, amountMax: max }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountMinDraft, amountMaxDraft]);

  const showChips = hasAdvancedFilters(query);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + stage + archived */}
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
            <SelectTrigger id="opportunity-stage" className="w-[150px]">
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
            <SelectTrigger id="opportunity-archived" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opportunity-currency">Currency</Label>
          <Select
            value={query.currency}
            onValueChange={(value) => onChange({ currency: value as OpportunityListQuery["currency"] })}
          >
            <SelectTrigger id="opportunity-currency" className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {Object.values(Currency).map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: date range + amount range */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opportunity-date-from">From date</Label>
          <Input
            id="opportunity-date-from"
            type="date"
            value={query.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opportunity-date-to">To date</Label>
          <Input
            id="opportunity-date-to"
            type="date"
            value={query.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opportunity-amount-min">Min amount</Label>
          <Input
            id="opportunity-amount-min"
            type="number"
            min={0}
            placeholder="0"
            value={amountMinDraft}
            onChange={(e) => setAmountMinDraft(e.target.value)}
            className="w-[130px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opportunity-amount-max">Max amount</Label>
          <Input
            id="opportunity-amount-max"
            type="number"
            min={0}
            placeholder="∞"
            value={amountMaxDraft}
            onChange={(e) => setAmountMaxDraft(e.target.value)}
            className="w-[130px]"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {showChips ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {query.currency !== "ALL" && (
            <Badge variant="secondary" className="gap-1">
              Currency: {CURRENCY_LABELS[query.currency as Currency]}
              <button onClick={() => onChange({ currency: "ALL" })} aria-label="Remove currency filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {query.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {query.dateFrom}
              <button onClick={() => onChange({ dateFrom: undefined })} aria-label="Remove from-date filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {query.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {query.dateTo}
              <button onClick={() => onChange({ dateTo: undefined })} aria-label="Remove to-date filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {query.amountMin !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Min: {query.amountMin.toLocaleString()}
              <button onClick={() => { setAmountMinDraft(""); onChange({ amountMin: undefined }); }} aria-label="Remove min amount filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {query.amountMax !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Max: {query.amountMax.toLocaleString()}
              <button onClick={() => { setAmountMaxDraft(""); onChange({ amountMax: undefined }); }} aria-label="Remove max amount filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setAmountMinDraft("");
              setAmountMaxDraft("");
              onChange(DEFAULT_ADVANCED);
            }}
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
