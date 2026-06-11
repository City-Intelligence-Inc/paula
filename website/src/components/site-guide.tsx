"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle, Play } from "lucide-react";

type DriverInstance = ReturnType<typeof driver>;

// Product-wide interactive guide. A persistent "?" floater on every surface
// (public site, parent dashboard, tutor portal) that runs a spotlight tour:
// the page dims/blurs, and each step pops the real button you'd press, with
// a short explanation. First visit auto-starts the area's tour once; the
// floater replays it anytime.
//
// The /admin portal keeps its own richer GuidedTour (welcome modal + live
// demo runner), so this guide stays out of /admin to avoid a double floater.

type Area = "public" | "dashboard" | "tutor";

interface GuideTour {
  id: string;
  label: string;
  steps: DriveStep[];
}

const TOURS: Record<Area, GuideTour> = {
  public: {
    id: "public",
    label: "How to get started",
    steps: [
      {
        popover: {
          title: "Welcome to Mathitude 👋",
          description:
            "Quick 30-second tour. We'll spotlight each step — everything else dims so you always know exactly where to click.",
        },
      },
      {
        element: '[data-guide="nav"]',
        popover: {
          title: "Find your way around",
          description:
            "These are the main sections — tutoring & groups, free resources, the calendar, events, and the shop.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-guide="consult"]',
        popover: {
          title: "Request a free consultation",
          description:
            "The fastest way to start. Tell us about your student and Paula reaches out to schedule — no commitment.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: 'a[href="/sign-up"]',
        popover: {
          title: "Already a Mathitude family?",
          description:
            "Create your account to see your student's notes, schedule, and billing in one place.",
          side: "bottom",
          align: "end",
        },
      },
      {
        popover: {
          title: "That's it!",
          description:
            "Tap the ? button in the bottom-right anytime to replay this walkthrough.",
        },
      },
    ],
  },
  dashboard: {
    id: "dashboard",
    label: "Tour your family portal",
    steps: [
      {
        popover: {
          title: "Your family portal 👋",
          description:
            "Everything about your student lives here. Quick tour — each step lights up the part of the screen it's talking about.",
        },
      },
      {
        element: '[data-guide="dash-nav"]',
        popover: {
          title: "Your sections",
          description:
            "Course materials, scheduling, billing, resources, and events — all from this menu.",
          side: "right",
          align: "start",
        },
      },
      {
        element: 'a[href="/dashboard/billing"]',
        popover: {
          title: "Billing & payment method",
          description:
            "Add or update your card and see your charges here. We email you whenever the card on file changes.",
          side: "right",
          align: "start",
        },
      },
      {
        popover: {
          title: "Replay anytime",
          description: "The ? button in the corner brings this tour back whenever you need it.",
        },
      },
    ],
  },
  tutor: {
    id: "tutor",
    label: "Tour the tutor portal",
    steps: [
      {
        popover: {
          title: "Your tutor portal 👋",
          description:
            "Plan your week and keep notes on your students. Quick tour — watch what lights up.",
        },
      },
      {
        element: '[data-guide="tutor-schedule"]',
        popover: {
          title: "Your next 7 days",
          description:
            "Every upcoming session across your students, grouped by day. Click any session to open that student.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-guide="tutor-students"]',
        popover: {
          title: "Your students",
          description:
            "Open a student to see their full history, add session notes, and launch their shared whiteboard.",
          side: "top",
          align: "center",
        },
      },
      {
        element: 'a[href="/tutor/resources"]',
        popover: {
          title: "Shared resource library",
          description:
            "Textbook links, instructions, and activities — filter by grade. No more copy-pasting from your own notes.",
          side: "bottom",
          align: "start",
        },
      },
      {
        popover: {
          title: "Replay anytime",
          description: "Tap the ? button in the corner to run this tour again.",
        },
      },
    ],
  },
};

function areaFor(pathname: string): Area | null {
  if (pathname.startsWith("/admin")) return null; // admin has its own guide
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/tutor")) return "tutor";
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;
  return "public";
}

export function SiteGuide() {
  const pathname = usePathname();
  const area = areaFor(pathname);
  const driverRef = useRef<DriverInstance | null>(null);
  const autoChecked = useRef<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const run = useCallback((a: Area) => {
    // Destroy any running instance first so re-launch is clean.
    driverRef.current?.destroy();
    const d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayColor: "rgba(17, 12, 24, 0.55)",
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: "mathitude-tour",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Got it",
      // Skip element steps whose anchor isn't on the current page rather than
      // breaking the tour.
      steps: TOURS[a].steps.filter((s) => {
        if (!s.element) return true;
        return !!document.querySelector(s.element as string);
      }),
    });
    driverRef.current = d;
    d.drive();
  }, []);

  // First visit per area → auto-start once.
  useEffect(() => {
    if (!ready || !area) return;
    if (autoChecked.current === area) return;
    autoChecked.current = area;
    const key = `mathitude_guide_${area}_v1`;
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      const t = setTimeout(() => run(area), 900);
      return () => clearTimeout(t);
    }
  }, [ready, area, run]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  if (!area) return null;

  return (
    <button
      onClick={() => run(area)}
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#7030A0] text-white shadow-lg hover:bg-[#5d288a] transition-colors h-12 pl-4 pr-5"
      aria-label="Replay the guided walkthrough"
      title="Show me how this works"
    >
      <HelpCircle className="h-5 w-5" />
      <span className="hidden sm:inline text-sm font-medium">Show me how</span>
      <Play className="h-3.5 w-3.5 sm:hidden" />
    </button>
  );
}
