"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

// C-7/C-8: instant autocomplete over an in-memory entity list (parents,
// students). The rosters are small (dozens, not thousands), so filtering
// client-side keeps it truly instant — no debounce round-trips.

export interface SearchItem {
  id: string;
  label: string;
  sublabel?: string;
}

export function EntitySearch({
  placeholder,
  items,
  onSelect,
  disabled,
}: {
  placeholder: string;
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return items
      .filter(
        (i) =>
          i.label.toLowerCase().includes(needle) ||
          (i.sublabel || "").toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [q, items]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
        <input
          value={q}
          disabled={disabled}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-neutral-300 pl-8 pr-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg overflow-hidden">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(m);
                setQ("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-50"
            >
              <span className="text-sm text-neutral-900">{m.label}</span>
              {m.sublabel && (
                <span className="text-xs text-neutral-400 ml-2">{m.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && matches.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg px-3 py-2 text-xs text-neutral-400">
          No matches.
        </div>
      )}
    </div>
  );
}
