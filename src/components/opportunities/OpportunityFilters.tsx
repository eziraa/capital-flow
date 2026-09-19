"use client";

import { Filter, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Currency, Stage } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

function countAdvancedFilters(q: OpportunityListQuery) {
  let count = 0;
  if (q.currency !== "ALL") count++;
  if (q.dateFrom) count++;
  if (q.dateTo) count++;
  if (q.amountMin !== undefined) count++;
  if (q.amountMax !== undefined) count++;
  return count;
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
  const [dateFromDraft, setDateFromDraft] = useState(query.dateFrom ?? "");
  const [dateToDraft, setDateToDraft] = useState(query.dateTo ?? "");
  const [currencyDraft, setCurrencyDraft] = useState(query.currency);
  
  // Update internal draft states when query props change externally (like clearing a chip)
  useEffect(() => {
    setAmountMinDraft(query.amountMin?.toString() ?? "");
    setAmountMaxDraft(query.amountMax?.toString() ?? "");
    setDateFromDraft(query.dateFrom ?? "");
    setDateToDraft(query.dateTo ?? "");
    setCurrencyDraft(query.currency);
  }, [query.amountMin, query.amountMax, query.dateFrom, query.dateTo, query.currency]);

  function applyAdvancedFilters() {
    onChange({
      amountMin: amountMinDraft ? Number(amountMinDraft) : undefined,
      amountMax: amountMaxDraft ? Number(amountMaxDraft) : undefined,
      dateFrom: dateFromDraft || undefined,
      dateTo: dateToDraft || undefined,
      currency: currencyDraft,
    });
  }

  function clearAdvancedFilters() {
    setAmountMinDraft("");
    setAmountMaxDraft("");
    setDateFromDraft("");
    setDateToDraft("");
    setCurrencyDraft("ALL");
    onChange(DEFAULT_ADVANCED);
  }

  const showChips = hasAdvancedFilters(query);
  const filterCount = countAdvancedFilters(query);

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Row: Search + Stage + Status + More Filters */}
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

        {/* More Filters Drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <Filter className="size-4" />
              More filters
              {filterCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {filterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>
                Refine your opportunities by financial metrics, date ranges, and currency.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-6 py-6 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="opportunity-currency-drawer">Currency</Label>
                <Select
                  value={currencyDraft}
                  onValueChange={(value) => setCurrencyDraft(value as OpportunityListQuery["currency"])}
                >
                  <SelectTrigger id="opportunity-currency-drawer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Currencies</SelectItem>
                    {Object.values(Currency).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="opportunity-date-from-drawer">From Date</Label>
                  <Input
                    id="opportunity-date-from-drawer"
                    type="date"
                    value={dateFromDraft}
                    onChange={(e) => setDateFromDraft(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="opportunity-date-to-drawer">To Date</Label>
                  <Input
                    id="opportunity-date-to-drawer"
                    type="date"
                    value={dateToDraft}
                    onChange={(e) => setDateToDraft(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="opportunity-amount-min-drawer">Min Amount</Label>
                  <Input
                    id="opportunity-amount-min-drawer"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={amountMinDraft}
                    onChange={(e) => setAmountMinDraft(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="opportunity-amount-max-drawer">Max Amount</Label>
                  <Input
                    id="opportunity-amount-max-drawer"
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={amountMaxDraft}
                    onChange={(e) => setAmountMaxDraft(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="mt-auto flex justify-between gap-2 border-t pt-4 sm:justify-between">
              <Button variant="ghost" onClick={clearAdvancedFilters}>
                Clear all
              </Button>
              <SheetClose asChild>
                <Button onClick={applyAdvancedFilters}>
                  Apply Filters
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
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
              <button onClick={() => onChange({ amountMin: undefined })} aria-label="Remove min amount filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {query.amountMax !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Max: {query.amountMax.toLocaleString()}
              <button onClick={() => onChange({ amountMax: undefined })} aria-label="Remove max amount filter">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange(DEFAULT_ADVANCED)}
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
