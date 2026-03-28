"use client";

import { useEffect, useState } from "react";
  const fetchApi = useApi();
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { FileText, ChevronRight } from "lucide-react";

interface ContentBlock {
  pageId: string;
  blockId: string;
  content: string;
  type: string;
  updatedAt: string;
  updatedBy: string;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  "math-engagement": "Math Engagement",
  tutoring: "Tutoring",
  shop: "Shop",
  events: "Events",
  contact: "Contact",
  about: "About",
};

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Record<string, ContentBlock[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/content-admin")
      .then((res) => res.json())
      .then((json) => {
        setPages(json.pages || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getLastUpdated(blocks: ContentBlock[]): string {
    if (blocks.length === 0) return "Never";
    const sorted = [...blocks].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return new Date(sorted[0].updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // All known pages (even if empty in DB)
  const allPageIds = Array.from(
    new Set([...Object.keys(PAGE_LABELS), ...Object.keys(pages)])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif italic font-medium text-neutral-900 tracking-tight">
          Page Editor
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Edit page content across the site
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {allPageIds.map((pageId) => {
            const blocks = pages[pageId] || [];
            return (
              <button
                key={pageId}
                onClick={() => router.push(`/admin/pages/${pageId}`)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100">
                    <FileText className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {PAGE_LABELS[pageId] || pageId}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {blocks.length}{" "}
                      {blocks.length === 1 ? "block" : "blocks"}
                      {blocks.length > 0 && (
                        <span className="ml-2">
                          Updated {getLastUpdated(blocks)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
