"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deferred to a microtask so the setState call isn't synchronous within the effect body.
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "h-9 w-9",
        className
      )}
      aria-label={
        mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"
      }
    >
      {mounted ? (
        isDark ? (
          <Sun className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
        ) : (
          <Moon className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
        )
      ) : (
        <span className={ICON_SIZE.md} />
      )}
    </button>
  );
}
