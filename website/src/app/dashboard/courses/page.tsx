"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Video } from "lucide-react";

interface CourseMaterial {
  title: string;
  type: "workbook" | "worksheet" | "video" | "activity";
  description: string;
  tags?: string[];
}

const gradeLevels: {
  value: string;
  label: string;
  shortLabel: string;
  materials: CourseMaterial[];
}[] = [
  {
    value: "preschool",
    label: "Preschool (Pre-K)",
    shortLabel: "Pre-K",
    materials: [
      {
        title: "Counting Adventures",
        type: "workbook",
        description: "Fun counting exercises with colorful illustrations for ages 3-5.",
        tags: ["Numbers", "Counting"],
      },
      {
        title: "Shape Explorers",
        type: "activity",
        description: "Hands-on shape recognition and pattern activities.",
        tags: ["Shapes", "Patterns"],
      },
      {
        title: "Math Through Play",
        type: "worksheet",
        description: "Printable worksheets combining play-based learning with early math concepts.",
        tags: ["Sorting", "Matching"],
      },
    ],
  },
  {
    value: "elementary",
    label: "Elementary (K-5)",
    shortLabel: "K-5",
    materials: [
      {
        title: "Mathitude Engagement Workbook: Elementary Edition",
        type: "workbook",
        description: "Paula's signature workbook integrating deep math mastery with engaging puzzles and activities.",
        tags: ["Addition", "Subtraction", "Multiplication", "Problem Solving"],
      },
      {
        title: "Pascal's Triangle Adventures",
        type: "activity",
        description: "Interactive exploration of Pascal's Triangle — a festival favorite!",
        tags: ["Patterns", "Number Theory"],
      },
      {
        title: "Swamp Puzzles: Level 1",
        type: "worksheet",
        description: "Downloadable logic puzzles set in a fun swamp theme.",
        tags: ["Logic", "Critical Thinking"],
      },
      {
        title: "Fraction Fun",
        type: "video",
        description: "Video series making fractions intuitive through visual models.",
        tags: ["Fractions", "Visual Math"],
      },
    ],
  },
  {
    value: "middle",
    label: "Middle School (6-8)",
    shortLabel: "6-8",
    materials: [
      {
        title: "Mathitude Engagement Workbook: Middle Grade Edition",
        type: "workbook",
        description: "Advanced problem-solving and mathematical reasoning for middle schoolers.",
        tags: ["Algebra", "Geometry", "Reasoning"],
      },
      {
        title: "Swamp Puzzles: Level 2",
        type: "worksheet",
        description: "Challenging logic and algebra puzzles with the signature swamp theme.",
        tags: ["Algebra", "Logic"],
      },
      {
        title: "Pre-Algebra Foundations",
        type: "activity",
        description: "Bridge activities connecting arithmetic mastery to algebraic thinking.",
        tags: ["Pre-Algebra", "Variables"],
      },
    ],
  },
  {
    value: "high",
    label: "High School (9-12)",
    shortLabel: "9-12",
    materials: [
      {
        title: "Algebra & Beyond",
        type: "workbook",
        description: "Enrichment materials for Algebra I/II, Geometry, and Pre-Calculus.",
        tags: ["Algebra", "Geometry", "Pre-Calc"],
      },
      {
        title: "SAT/ACT Math Prep",
        type: "worksheet",
        description: "Targeted practice sets aligned with standardized test formats.",
        tags: ["Test Prep", "SAT", "ACT"],
      },
      {
        title: "Math in the Real World",
        type: "video",
        description: "Video explorations connecting classroom math to economics, engineering, and data science.",
        tags: ["Applied Math", "Careers"],
      },
    ],
  },
  {
    value: "college",
    label: "College",
    shortLabel: "College",
    materials: [
      {
        title: "Calculus Confidence",
        type: "activity",
        description: "Supplementary materials for Calc I-III with intuitive explanations.",
        tags: ["Calculus", "Analysis"],
      },
      {
        title: "Statistics & Probability",
        type: "workbook",
        description: "Applied statistics workbook drawing on Paula's economics research background.",
        tags: ["Statistics", "Probability", "Economics"],
      },
    ],
  },
];

const typeIcon = {
  workbook: BookOpen,
  worksheet: FileText,
  video: Video,
  activity: BookOpen,
};

const typeColor = {
  workbook: "bg-mathitude-orange/10 text-mathitude-orange",
  worksheet: "bg-mathitude-blue/10 text-mathitude-blue",
  video: "bg-mathitude-red/10 text-mathitude-red",
  activity: "bg-mathitude-green/10 text-mathitude-green",
};

export default function CoursesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-mathitude-navy">
          Course Materials
        </h1>
        <p className="mt-2 text-gray-600">
          Browse enrichment materials organized by grade level.
        </p>
      </div>

      <Tabs defaultValue="elementary" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-gray-100/80 p-1 rounded-lg">
          {gradeLevels.map((grade) => (
            <TabsTrigger
              key={grade.value}
              value={grade.value}
              className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-mathitude-teal data-[state=active]:text-white"
            >
              <span className="hidden sm:inline">{grade.label}</span>
              <span className="sm:hidden">{grade.shortLabel}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {gradeLevels.map((grade) => (
          <TabsContent key={grade.value} value={grade.value} className="mt-6">
            <div className="grid gap-4">
              {grade.materials.map((material) => {
                const Icon = typeIcon[material.type];
                return (
                  <Card
                    key={material.title}
                    className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-5 pb-5 px-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typeColor[material.type]}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-mathitude-navy">
                              {material.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider"
                            >
                              {material.type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {material.description}
                          </p>
                          {material.tags && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {material.tags.map((tag) => (
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
