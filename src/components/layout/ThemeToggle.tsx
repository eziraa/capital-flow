"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="size-8"
    >
      {/* Sun shown in dark mode (click → go light), Moon shown in light mode (click → go dark) */}
      <Sun className="size-4 scale-100 transition-transform dark:scale-0" aria-hidden="true" />
      <Moon
        className="absolute size-4 scale-0 transition-transform dark:scale-100"
        aria-hidden="true"
      />
    </Button>
  );
}
