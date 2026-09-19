"use client";

import { useEffect } from "react";

/**
 * Registers a keyboard shortcut. The handler fires when the key is pressed
 * and no input/textarea/select has focus (so typing in fields is unaffected).
 */
export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: { meta?: boolean; ctrl?: boolean; shift?: boolean } = {},
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable;

      // Allow meta/ctrl combos even in inputs (e.g. Cmd+K)
      const hasMeta = options.meta || options.ctrl;
      if (isEditable && !hasMeta) return;

      const metaMatch = options.meta ? e.metaKey || e.ctrlKey : true;
      const ctrlMatch = options.ctrl ? e.ctrlKey : true;
      const shiftMatch = options.shift ? e.shiftKey : !e.shiftKey;
      const noExtraModifiers = !options.meta && !options.ctrl ? !e.metaKey && !e.ctrlKey : true;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        metaMatch &&
        ctrlMatch &&
        shiftMatch &&
        noExtraModifiers
      ) {
        handler(e);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, options.meta, options.ctrl, options.shift]);
}
