"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";

// C-10: view the family's signed contract. The PDF is streamed through
// /api/me/contract?file=1 — parents see their own family's contract only,
// and S3 URLs never reach the browser.

export default function ContractPage() {
  const fetchApi = useApi();
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");

  useEffect(() => {
    fetchApi("/api/me/contract")
      .then((r) => r.json())
      .then((j) => setState(j.hasContract ? "ready" : "none"))
      .catch(() => setState("none"));
  }, [fetchApi]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your contract"
        description="The signed agreement for this academic year."
      />
      {state === "loading" ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : state === "none" ? (
        <Card className="p-10 text-center">
          <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 font-medium">
            No contract on file yet.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Once your signed agreement is uploaded by the Mathitude team it
            will appear here.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <iframe
            src="/api/me/contract?file=1"
            title="Signed contract"
            className="w-full"
            style={{ height: "80vh", border: 0 }}
          />
        </Card>
      )}
    </div>
  );
}
