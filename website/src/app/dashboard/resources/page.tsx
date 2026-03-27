"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ExternalLink,
  FileDown,
  Play,
  Puzzle,
  Link2,
} from "lucide-react";

interface Resource {
  title: string;
  description: string;
  linkText?: string;
  href?: string;
  tags?: string[];
}

const books: Resource[] = [
  {
    title: "Mathitude Engagement Workbook: Elementary Edition",
    description:
      "Paula's signature workbook fostering big mathematical thinking through fun, integrated skill-building for elementary students.",
    linkText: "View on Amazon",
    tags: ["Grades K-5", "Workbook"],
  },
  {
    title: "Mathitude Engagement Workbook: Middle Grade Edition",
    description:
      "Advanced problem-solving and mathematical reasoning workbook for middle school students.",
    linkText: "View on Amazon",
    tags: ["Grades 6-8", "Workbook"],
  },
  {
    title: "Swamp Puzzles Collection",
    description:
      "A fan-favorite collection of logic puzzles with a fun swamp theme. Great for building critical thinking skills.",
    linkText: "View on Amazon",
    tags: ["All Ages", "Puzzles"],
  },
];

const videos: Resource[] = [
  {
    title: "Pascal's Triangle Exploration",
    description:
      "Discover the beautiful patterns hidden in Pascal's Triangle — from the interactive festival demo.",
    linkText: "Watch on YouTube",
    tags: ["Patterns", "Number Theory"],
  },
  {
    title: "Making Fractions Fun",
    description:
      "Visual and intuitive approach to understanding fractions for elementary students.",
    linkText: "Watch on YouTube",
    tags: ["Fractions", "Elementary"],
  },
  {
    title: "Math in Everyday Life",
    description:
      "Paula shows how math is everywhere — from grocery shopping to architecture.",
    linkText: "Watch on YouTube",
    tags: ["Applied Math", "Engagement"],
  },
];

const puzzles: Resource[] = [
  {
    title: "Swamp Puzzles: Beginner Pack",
    description:
      "Printable logic puzzles perfect for early elementary students. 12 pages of fun challenges.",
    linkText: "Download PDF",
    tags: ["Grades K-2", "Logic"],
  },
  {
    title: "Swamp Puzzles: Intermediate Pack",
    description:
      "More challenging swamp-themed puzzles for upper elementary students. 16 pages.",
    linkText: "Download PDF",
    tags: ["Grades 3-5", "Logic"],
  },
  {
    title: "Swamp Puzzles: Advanced Pack",
    description:
      "Complex logic and algebra puzzles for middle school students. 20 pages.",
    linkText: "Download PDF",
    tags: ["Grades 6-8", "Algebra"],
  },
  {
    title: "Pascal's Triangle Coloring Sheet",
    description:
      "Color in patterns within Pascal's Triangle — a meditative and mathematical activity.",
    linkText: "Download PDF",
    tags: ["All Ages", "Patterns"],
  },
];

const tools: Resource[] = [
  {
    title: "Khan Academy",
    description:
      "Free, world-class education for anyone, anywhere. Excellent supplementary resource.",
    linkText: "Visit Site",
    href: "https://www.khanacademy.org",
    tags: ["Free", "All Grades"],
  },
  {
    title: "Desmos Graphing Calculator",
    description:
      "Beautiful, free online graphing calculator. Great for visualizing functions.",
    linkText: "Visit Site",
    href: "https://www.desmos.com",
    tags: ["Free", "Graphing"],
  },
  {
    title: "NRICH Mathematics",
    description:
      "Rich mathematical tasks for all ages from the University of Cambridge.",
    linkText: "Visit Site",
    href: "https://nrich.maths.org",
    tags: ["Free", "Enrichment"],
  },
  {
    title: "Art of Problem Solving",
    description:
      "Community and resources for students who love math and want to go deeper.",
    linkText: "Visit Site",
    href: "https://artofproblemsolving.com",
    tags: ["Competition", "Advanced"],
  },
  {
    title: "Mathigon",
    description:
      "Interactive, beautifully designed math courses and activities.",
    linkText: "Visit Site",
    href: "https://mathigon.org",
    tags: ["Free", "Interactive"],
  },
];

const tabConfig = [
  {
    value: "books",
    label: "Published Books",
    icon: BookOpen,
    data: books,
    actionIcon: ExternalLink,
  },
  {
    value: "videos",
    label: "YouTube Videos",
    icon: Play,
    data: videos,
    actionIcon: ExternalLink,
  },
  {
    value: "puzzles",
    label: "Puzzles & PDFs",
    icon: Puzzle,
    data: puzzles,
    actionIcon: FileDown,
  },
  {
    value: "tools",
    label: "Math Tools",
    icon: Link2,
    data: tools,
    actionIcon: ExternalLink,
  },
];

export default function ResourcesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-mathitude-navy">
          Resources
        </h1>
        <p className="mt-2 text-gray-600">
          Paula&apos;s published books, videos, downloadable puzzles, and
          curated math engagement tools.
        </p>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-gray-100/80 p-1 rounded-lg">
          {tabConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 min-w-[100px] text-xs sm:text-sm gap-1.5 data-[state=active]:bg-mathitude-teal data-[state=active]:text-white"
            >
              <tab.icon className="w-3.5 h-3.5 hidden sm:inline" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="grid gap-4">
              {tab.data.map((item) => (
                <Card
                  key={item.title}
                  className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-5 pb-5 px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-mathitude-navy">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.description}
                        </p>
                        {item.tags && (
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
                          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-mathitude-teal hover:text-mathitude-teal-dark transition-colors"
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
