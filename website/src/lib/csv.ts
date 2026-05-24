// Client-side CSV export. Each list page calls downloadCsv(rows, columns,
// filename) with the filtered+sorted rows it's already rendering, so the
// export always matches what the user sees on screen — no surprises.

export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  // Optional transform; receives the row, returns the cell value.
  value?: (row: T) => string | number | boolean | null | undefined;
}

function escape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string,
): void {
  const headerLine = columns.map((c) => escape(c.header)).join(",");
  const bodyLines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key as string];
        return escape(raw);
      })
      .join(","),
  );
  const csv = [headerLine, ...bodyLines].join("\n");
  // BOM so Excel + Numbers detect UTF-8 correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
