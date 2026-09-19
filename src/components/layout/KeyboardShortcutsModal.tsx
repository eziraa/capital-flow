"use client";

import { useCallback, useState } from "react";
import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeyboardShortcut } from "@/lib/use-keyboard-shortcut";

type Shortcut = { keys: string[]; description: string };

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "Navigation",
    items: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "O"], description: "Go to Opportunities" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    group: "Opportunities list",
    items: [
      { keys: ["/"], description: "Focus search" },
      { keys: ["N"], description: "New opportunity (admin)" },
    ],
  },
  {
    group: "Global",
    items: [
      { keys: ["Esc"], description: "Close dialog / clear focus" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      setOpen(true);
    },
    [],
  );

  useKeyboardShortcut("?", openModal, { shift: true });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Keyboard shortcuts"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            {SHORTCUTS.map((group) => (
              <div key={group.group}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.group}
                </p>
                <ul className="flex flex-col gap-2">
                  {group.items.map((shortcut) => (
                    <li
                      key={shortcut.description}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
