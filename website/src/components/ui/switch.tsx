"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal, dependency-free toggle. Off = warm neutral, On = moss/teal success
// (#0F7B6C per DESIGN.md — never green-500). Used for the "In-session view"
// switch that hides Private Notes (spec N-3).
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-mathitude-purple/40 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#0F7B6C]" : "bg-zinc-300",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
