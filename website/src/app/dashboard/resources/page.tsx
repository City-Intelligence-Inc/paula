"use client";

import { useEffect, useState } from "react";
  const fetchApi = useApi();
import { useApi } from "@/hooks/use-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ExternalLink,
  FileDown,
  FolderOpen,
  Play,
  Puzzle,
  Link2,
} from "lucide-react";
import type { Resource } from "@/lib/types";

const tabConfig = [
  {
    value: "books" as const,
    label: "Published Books",
    icon: BookOpen,
    actionIcon: ExternalLink,
  },
  {
    value: "videos" as const,
    label: "YouTube Videos",
    icon: Play,
    actionIcon: ExternalLink,
  },
  {
    value: "puzzles" as const,
    label: "Puzzles & PDFs",
    icon: Puzzle,
    actionIcon: FileDown,
  },
  {
    value: "tools" as const,
    label: "Math Tools",
    icon: Link2,
    actionIcon: ExternalLink,
  },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/api/resources")
      .then((res) => res.json())
      .then((json) => {
        setResources(json.resources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-serif italic font-medium text-neutral-900 tracking-tight">
            Resources
          </h1>
          <p className="mt-2 text-neutral-600">
            Paula&apos;s published books, videos, downloadable puzzles, and
            curated math engagement tools.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Group resources by category
  const resourcesByCategory: Record<string, Resource[]> = {};
  for (const r of resources) {
    if (!resourcesByCategory[r.category]) {
      resourcesByCategory[r.category] = [];
    }
    resourcesByCategory[r.category].push(r);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic font-medium text-neutral-900 tracking-tight">
          Resources
        </h1>
        <p className="mt-2 text-neutral-600">
          Paula&apos;s published books, videos, downloadable puzzles, and
          curated math engagement tools.
        </p>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-neutral-100/80 p-1 rounded-lg">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[100px] text-xs sm:text-sm gap-1.5 data-[state=active]:bg-neutral-900 data-[state=active]:text-white"
            >
              <tab.icon className="w-3.5 h-3.5 hidden sm:inline" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((tab) => {
          const items = resourcesByCategory[tab.value] || [];
          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">
                    No {tab.label.toLowerCase()} available yet. Paula is adding new content regularly — check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="border border-neutral-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
                    >
                      <CardContent className="pt-5 pb-5 px-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-900">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-sm text-neutral-600">
                              {item.description}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-[10px] font-normal"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {item.linkText && (
                            <a
                              href={item.href || "#"}
                              target={item.href ? "_blank" : undefined}
                              rel={item.href ? "noopener noreferrer" : undefined}
                              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                            >
                              <tab.actionIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {item.linkText}
                              </span>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
