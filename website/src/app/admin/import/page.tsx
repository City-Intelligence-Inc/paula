"use client";

import { useCallback, useRef, useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

// ---------------------------------------------------------------------------
// Column mapping helpers
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = [
  "firstName",
  "lastName",
  "grade",
  "status",
  "parentName",
  "parentEmail",
  "parentPhone",
  "sessionType",
  "rate",
] as const;

type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number];

/** Best-effort auto-detect: map CSV header -> expected field */
function autoMapColumns(
  headers: string[]
): Record<string, ExpectedColumn | ""> {
  const aliases: Record<string, ExpectedColumn> = {
    firstname: "firstName",
    first_name: "firstName",
    first: "firstName",
    "first name": "firstName",
    lastname: "lastName",
    last_name: "lastName",
    last: "lastName",
    "last name": "lastName",
    grade: "grade",
    status: "status",
    parentname: "parentName",
    parent_name: "parentName",
    parent: "parentName",
    "parent name": "parentName",
    parentemail: "parentEmail",
    parent_email: "parentEmail",
    "parent email": "parentEmail",
    email: "parentEmail",
    parentphone: "parentPhone",
    parent_phone: "parentPhone",
    "parent phone": "parentPhone",
    phone: "parentPhone",
    sessiontype: "sessionType",
    session_type: "sessionType",
    "session type": "sessionType",
    type: "sessionType",
    rate: "rate",
    price: "rate",
  };

  const mapping: Record<string, ExpectedColumn | ""> = {};
  headers.forEach((h) => {
    const key = h.toLowerCase().replace(/[^a-z_ ]/g, "");
    mapping[h] = aliases[key] || "";
  });
  return mapping;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ImportResult = {
  row: number;
  name: string;
  ok: boolean;
  error?: string;
};

export default function AdminImportPage() {
  const fetchApi = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, ExpectedColumn | "">>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [done, setDone] = useState(false);

  // ---- File handling ----

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setResults([]);
    setDone(false);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const parsed = parseCSV(text);
      if (parsed.length === 0) return;

      const h = Object.keys(parsed[0]);
      setHeaders(h);
      setRows(parsed);
      setMapping(autoMapColumns(h));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // ---- Column mapping change ----

  function updateMapping(header: string, value: string) {
    setMapping((prev) => ({ ...prev, [header]: value as ExpectedColumn | "" }));
  }

  // ---- Import ----

  async function handleImport() {
    setImporting(true);
    setDone(false);
    setTotal(rows.length);
    setProgress(0);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Map row values using the column mapping
      const student: Record<string, string | number> = {};
      for (const [csvHeader, field] of Object.entries(mapping)) {
        if (field && row[csvHeader] !== undefined) {
          student[field] =
            field === "rate" ? parseFloat(row[csvHeader]) || 0 : row[csvHeader];
        }
      }

      // Default values
      if (!student.status) student.status = "active";
      if (!student.sessionType) student.sessionType = "individual";

      const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();

      try {
        const res = await fetchApi("/api/students", {
          method: "POST",
          body: JSON.stringify(student),
        });

        if (res.ok) {
          importResults.push({ row: i + 1, name, ok: true });
        } else {
          const json = await res.json().catch(() => ({}));
          importResults.push({
            row: i + 1,
            name,
            ok: false,
            error: json.error || `HTTP ${res.status}`,
          });
        }
      } catch (err) {
        importResults.push({
          row: i + 1,
          name,
          ok: false,
          error: "Network error",
        });
      }

      setProgress(i + 1);
      setResults([...importResults]);
    }

    setImporting(false);
    setDone(true);
  }

  // ---- Derived values ----

  const successCount = results.filter((r) => r.ok).length;
  const errorCount = results.filter((r) => !r.ok).length;
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const hasRequiredFields =
    mappedFields.has("firstName") && mappedFields.has("lastName");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Import Students
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Upload a CSV file to bulk-import students into Mathitude.
          </p>
        </div>
        <a
          href="/sample-students.csv"
          download
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download sample CSV
        </a>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-neutral-400 bg-neutral-50"
              : "border-neutral-300 hover:border-neutral-400"
          }`}
        >
          <Upload className="mx-auto h-10 w-10 text-neutral-400 mb-4" />
          <p className="text-sm font-medium text-neutral-700">
            Drag and drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Accepts .csv files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !done && (
        <>
          {/* File info */}
          <Card className="border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {fileName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {rows.length} student{rows.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRows([]);
                  setHeaders([]);
                  setMapping({});
                  setFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
              >
                Clear
              </Button>
            </div>
          </Card>

          {/* Column mapping */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-3">
              Column Mapping
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Verify that each CSV column maps to the correct student field.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 min-w-[100px] truncate">
                    {h}
                  </span>
                  <span className="text-neutral-300">&rarr;</span>
                  <select
                    value={mapping[h] || ""}
                    onChange={(e) => updateMapping(h, e.target.value)}
                    className="flex-1 border border-neutral-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
                  >
                    <option value="">-- skip --</option>
                    {EXPECTED_COLUMNS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-3">
              Preview
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-neutral-200 divide-y divide-neutral-200">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      #
                    </th>
                    {headers
                      .filter((h) => mapping[h])
                      .map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          {mapping[h]}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                      {headers
                        .filter((h) => mapping[h])
                        .map((h) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-neutral-900 whitespace-nowrap"
                          >
                            {row[h]}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <p className="text-xs text-neutral-400 mt-2 text-center">
                  Showing first 10 of {rows.length} rows
                </p>
              )}
            </div>
          </div>

          {/* Progress bar (during import) */}
          {importing && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-700">
                  Importing...
                </p>
                <p className="text-sm text-neutral-500">
                  {progress} / {total}
                </p>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                  style={{
                    width: total > 0 ? `${(progress / total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Import button */}
          {!importing && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleImport}
                disabled={!hasRequiredFields}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {rows.length} Student{rows.length !== 1 ? "s" : ""}
              </Button>
              {!hasRequiredFields && (
                <p className="text-sm text-neutral-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Map at least firstName and lastName to continue
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Results */}
      {done && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border border-neutral-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-4">
              Import Complete
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-neutral-900">
                  {successCount} imported
                </span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-neutral-900">
                    {errorCount} failed
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Detail table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-neutral-200 divide-y divide-neutral-200">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {results.map((r) => (
                  <tr key={r.row}>
                    <td className="px-3 py-2 text-neutral-400">{r.row}</td>
                    <td className="px-3 py-2 text-neutral-900">{r.name}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Imported
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          {r.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setRows([]);
                setHeaders([]);
                setMapping({});
                setFileName("");
                setResults([]);
                setDone(false);
                setProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-md"
            >
              Import More
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/students")}
              className="border-neutral-200 text-neutral-600 hover:border-neutral-300 rounded-md"
            >
              View Students
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
