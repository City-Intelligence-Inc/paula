"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import {
  HelpCircle,
  X,
  Compass,
  GraduationCap,
  CreditCard,
  Inbox,
  KeyRound,
} from "lucide-react";

// First-time guided tour for the staff portal, built for Paula.
//
// Three pieces: (1) a welcome modal on the very first admin visit, (2) a
// floating "?" launcher to replay the tour or learn a single task anytime,
// and (3) action tutorials that navigate to the right page, then spotlight
// the real buttons with driver.js. Cross-page launches persist the chosen
// tour in sessionStorage and resume after the route change.

const SEEN_KEY = "mathitude_admin_tour_v1";
const PENDING_KEY = "mathitude_pending_tour";

interface Tour {
  id: string;
  label: string;
  blurb: string;
  Icon: typeof Compass;
  startPage: string;
  steps: DriveStep[];
}

function pageMatches(startPage: string, pathname: string): boolean {
  return startPage === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(startPage);
}

const TOURS: Tour[] = [
  {
    id: "quick",
    label: "Quick tour of the portal",
    blurb: "60-second overview of every section",
    Icon: Compass,
    startPage: "/admin",
    steps: [
      {
        popover: {
          title: "Welcome to your staff portal 👋",
          description:
            "This is where you run Mathitude day to day — families, billing, scheduling, and notes. Quick 60-second tour of the sections.",
        },
      },
      {
        element: '[data-tour="nav-families"]',
        popover: {
          title: "Families",
          description:
            "Every household lives here: parents/caregivers, students, payment methods, and full session history — all in one view.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-students"]',
        popover: {
          title: "Students",
          description:
            "Jump straight to a student to see their tutors, session notes, and (admin-only) school portal logins.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-billing"]',
        popover: {
          title: "Billing queue",
          description:
            "Completed sessions wait here. Review, tweak the rate if needed, then approve to charge — every charge shows as MATHITUDE.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-calendar"]',
        popover: {
          title: "Calendar",
          description:
            "The weekly schedule. Filter by tutor; a shared student shows on each of their tutors' views.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-consultations"]',
        popover: {
          title: "Consultations",
          description:
            "Every contact-form submission from the public website lands here, so no lead gets lost.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-notifications"]',
        popover: {
          title: "Notifications",
          description:
            "Whenever a parent updates a card, you see it here (and by email) with the last 4 digits — the thing the old Wix site never told you.",
          side: "right",
          align: "start",
        },
      },
      {
        popover: {
          title: "That's the tour!",
          description:
            "Tap the ? button in the bottom-right anytime to replay this or learn a specific task like adding a student or a card.",
        },
      },
    ],
  },
  {
    id: "add-student",
    label: "Add or remove a student",
    blurb: "New family, new sibling, or removing one",
    Icon: GraduationCap,
    startPage: "/admin/families",
    steps: [
      {
        element: '[data-tour="add-family"]',
        popover: {
          title: "Add a brand-new family",
          description:
            "Click Add Family to enter the first parent and first student together. This creates the household and links them automatically.",
          side: "bottom",
          align: "end",
        },
      },
      {
        popover: {
          title: "Adding a sibling later",
          description:
            "Already have the family? Open it from the list, then use 'Add sibling'. The new student joins the same household — no re-typing the parent or re-entering the card.",
        },
      },
      {
        popover: {
          title: "Removing a student",
          description:
            "Open the family and use the student's Remove control. The family and its billing stay intact — only that student is detached.",
        },
      },
    ],
  },
  {
    id: "manage-cards",
    label: "Add or remove a credit card",
    blurb: "Payment methods and the default card",
    Icon: CreditCard,
    startPage: "/admin/families",
    steps: [
      {
        popover: {
          title: "Open any family",
          description:
            "Pick a family from this list to manage its payment methods.",
        },
      },
      {
        popover: {
          title: "Add, remove, set default",
          description:
            "Inside the family, find 'Payment methods'. Add a card, set which one is the default for billing, or remove one. Charges always use the default card.",
        },
      },
      {
        popover: {
          title: "Parents can do it too",
          description:
            "Parents add or remove their own card from their dashboard. You get a notification with the last 4 digits each time, then confirm whether it becomes the new default.",
        },
      },
    ],
  },
  {
    id: "bill",
    label: "Approve & bill sessions",
    blurb: "Turn completed sessions into charges",
    Icon: Inbox,
    startPage: "/admin/billing",
    steps: [
      {
        popover: {
          title: "Your billing queue",
          description:
            "Every completed session waiting to be billed shows up here, with student, tutor, date, rate, and the payer.",
        },
      },
      {
        element: '[data-tour="approve-billing"]',
        popover: {
          title: "Approve & charge",
          description:
            "Select the sessions to bill (adjust rate or duration first if you need to), then Approve & charge. We charge the family's default card as MATHITUDE — you never type a name.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },
  {
    id: "school-logins",
    label: "Store school logins",
    blurb: "Secure ghost-student credentials",
    Icon: KeyRound,
    startPage: "/admin/students",
    steps: [
      {
        popover: {
          title: "Open any student",
          description: "Pick a student from this list.",
        },
      },
      {
        popover: {
          title: "School portal logins",
          description:
            "Scroll to the bottom of the student page to 'School portal logins'. Store their school account logins securely (admin-only) so you can sign in as the ghost student. Tutors and parents never see these.",
        },
      },
    ],
  },
];

function runTour(tour: Tour) {
  const d = driver({
    showProgress: true,
    overlayColor: "rgba(17, 12, 24, 0.6)",
    popoverClass: "mathitude-tour",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Done",
    steps: tour.steps,
  });
  d.drive();
}

export function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const welcomeChecked = useRef(false);

  // First-ever visit → welcome modal (only on the dashboard).
  useEffect(() => {
    if (welcomeChecked.current) return;
    if (typeof window === "undefined") return;
    welcomeChecked.current = true;
    if (pathname === "/admin" && !localStorage.getItem(SEEN_KEY)) {
      setWelcomeOpen(true);
    }
  }, [pathname]);

  // Resume a cross-page tour after navigation lands on the start page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (!pending) return;
    const tour = TOURS.find((t) => t.id === pending);
    if (tour && pageMatches(tour.startPage, pathname)) {
      sessionStorage.removeItem(PENDING_KEY);
      // Let the destination page paint its anchors before spotlighting.
      const t = setTimeout(() => runTour(tour), 650);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const launch = useCallback(
    (tour: Tour) => {
      setMenuOpen(false);
      setWelcomeOpen(false);
      if (pageMatches(tour.startPage, pathname)) {
        runTour(tour);
      } else {
        sessionStorage.setItem(PENDING_KEY, tour.id);
        router.push(tour.startPage);
      }
    },
    [pathname, router],
  );

  const dismissWelcome = useCallback(() => {
    setWelcomeOpen(false);
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
  }, []);

  const startWelcomeTour = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
    const quick = TOURS.find((t) => t.id === "quick")!;
    launch(quick);
  }, [launch]);

  return (
    <>
      {/* First-visit welcome */}
      {welcomeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-neutral-200 p-6 md:p-8">
            <div className="flex items-center gap-2 text-mathitude-purple">
              <Compass className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Welcome
              </span>
            </div>
            <h2
              className="mt-3 text-2xl text-neutral-900"
              style={{ fontFamily: "var(--font-original-surfer)" }}
            >
              Your Mathitude staff portal
            </h2>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              This is where you run everything — families, billing, scheduling,
              and notes. Want a quick 60-second walkthrough? You can replay it
              or learn a specific task anytime from the ? button.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={dismissWelcome}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-800 px-3 py-2"
              >
                Skip for now
              </button>
              <button
                onClick={startWelcomeTour}
                className="rounded-md bg-mathitude-purple text-white hover:bg-[#5d288a] text-sm font-medium uppercase tracking-wide px-5 py-2.5"
              >
                Take the tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating launcher menu */}
      {menuOpen && (
        <div className="fixed bottom-20 right-5 z-[55] w-72 rounded-xl bg-white shadow-xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-900">
              Guided tutorials
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-neutral-400 hover:text-neutral-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="py-1">
            {TOURS.map((tour) => (
              <button
                key={tour.id}
                onClick={() => launch(tour)}
                className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
              >
                <tour.Icon className="h-4 w-4 mt-0.5 text-mathitude-purple shrink-0" />
                <span>
                  <span className="block text-sm font-medium text-neutral-900">
                    {tour.label}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {tour.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating help button */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[55] inline-flex items-center gap-2 rounded-full bg-mathitude-purple text-white shadow-lg hover:bg-[#5d288a] transition-colors h-12 pl-4 pr-5"
        aria-label="Guided tutorials"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Help</span>
      </button>
    </>
  );
}
