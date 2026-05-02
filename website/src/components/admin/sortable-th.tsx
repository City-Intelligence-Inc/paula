"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useState } from "react";

export type SortDir = "asc" | "desc";

export function useSort<K extends string>(initialKey: K, initialDir: SortDir = "asc") {
  const [key, setKey] = useState<K>(initialKey);
  const [dir, setDir] = useState<SortDir>(initialDir);

  function toggle(k: K) {
    if (key === k) {
      setDir(dir === "asc" ? "desc" : "asc");
    } else {
      setKey(k);
      setDir("asc");
    }
  }

  function compare<T>(getter: (row: T, k: K) => string | number) {
    return (a: T, b: T): number => {
      const av = getter(a, key);
      const bv = getter(b, key);
      let r = 0;
      if (typeof av === "number" && typeof bv === "number") r = av - bv;
      else r = String(av).localeCompare(String(bv));
      return dir === "asc" ? r : -r;
    };
  }

  return { key, dir, toggle, compare };
}

interface Props<K extends string> {
  sortKey: K;
  activeKey: K;
  dir: SortDir;
  onClick: (k: K) => void;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function SortableTh<K extends string>({
  sortKey,
  activeKey,
  dir,
  onClick,
  children,
  align = "left",
  className = "",
}: Props<K>) {
  const active = sortKey === activeKey;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <th className={`px-3 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1.5 w-full ${justify} font-medium uppercase tracking-wider text-xs transition-colors ${
          active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        {children}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

// Same affordance for non-<table> grids
export function SortableHeader<K extends string>({
  sortKey,
  activeKey,
  dir,
  onClick,
  children,
  align = "left",
}: Props<K>) {
  const active = sortKey === activeKey;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`inline-flex items-center gap-1.5 ${justify} font-medium uppercase tracking-wider text-xs transition-colors ${
        active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
      }`}
    >
      {children}
      <Icon className="h-3 w-3" />
    </button>
  );
}
