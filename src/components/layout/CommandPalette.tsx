"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Stage } from "@prisma/client";

import { listOpportunities } from "@/actions/opportunities";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { STAGE_LABELS } from "@/components/ui/status-badges";
import { useKeyboardShortcut } from "@/lib/use-keyboard-shortcut";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useKeyboardShortcut("k", () => setOpen((o) => !o), { meta: true });
  useKeyboardShortcut("k", () => setOpen((o) => !o), { ctrl: true });

  const { data: result } = useSWR(
    open ? ["cmd-palette-search", query] : null,
    () => listOpportunities({ q: query, stage: "ALL", archived: "ACTIVE", sort: "submissionDate", dir: "desc", page: 1, currency: "ALL" }),
    { keepPreviousData: true }
  );

  // Reset query on open
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const items = result?.ok ? result.data.items : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[500px]">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 size-4 shrink-0 opacity-50" />
          <input
            autoFocus
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search opportunities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {items.length === 0 && query !== "" && (
            <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
          )}
          {items.length === 0 && query === "" && (
            <p className="p-4 text-center text-sm text-muted-foreground">Type a company name to search...</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              className="flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
              onClick={() => {
                setOpen(false);
                router.push(`/opportunities/${item.id}`);
              }}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium">{item.companyName}</span>
                <span className="text-xs text-muted-foreground">
                  {STAGE_LABELS[item.stage]} • {item.currency} {item.requestedAmount.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
