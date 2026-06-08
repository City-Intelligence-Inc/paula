// Canonical Bay Area school academic-calendar list.
// Extracted from admin/calendar/page.tsx so this config data lives in one
// module instead of being hardcoded inside the page component. Replace with
// researched dates / a DB-backed source when ready.

export interface SchoolCalendar {
  name: string;
  location: string;
  note?: string;
  fallStart: string;
  winterBreakStart: string;
  winterBreakEnd: string;
  springBreakStart: string;
  springBreakEnd: string;
  lastDay: string;
  status: "Researched" | "Pending";
}

export const INITIAL_SCHOOL_CALENDARS: SchoolCalendar[] = [
  {
    name: "Nueva School",
    location: "Hillsborough",
    note: "Mathitude staff presenting at STEM fair",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-15",
    springBreakEnd: "2027-03-26",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Castilleja School",
    location: "Palo Alto",
    note: "Sarah's alma mater",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Researched",
  },
  {
    name: "Menlo School",
    location: "Atherton",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Sacred Heart Prep",
    location: "Atherton",
    fallStart: "2026-08-19",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-03",
    status: "Researched",
  },
  {
    name: "Woodside Priory",
    location: "Portola Valley",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "Crystal Springs Uplands",
    location: "Hillsborough",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Pending",
  },
  {
    name: "Harker School",
    location: "San Jose",
    fallStart: "2026-08-19",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Researched",
  },
  {
    name: "Pinewood School",
    location: "Los Altos",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Pending",
  },
  {
    name: "Keys School",
    location: "Palo Alto",
    fallStart: "2026-08-25",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-15",
    springBreakEnd: "2027-03-26",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "Woodland School",
    location: "Portola Valley",
    fallStart: "2026-08-24",
    winterBreakStart: "2026-12-18",
    winterBreakEnd: "2027-01-04",
    springBreakStart: "2027-03-14",
    springBreakEnd: "2027-03-25",
    lastDay: "2027-06-04",
    status: "Researched",
  },
  {
    name: "Phillips Brooks School",
    location: "Menlo Park",
    fallStart: "2026-08-26",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-16",
    springBreakEnd: "2027-03-27",
    lastDay: "2027-06-05",
    status: "Pending",
  },
  {
    name: "German International School",
    location: "Mountain View",
    fallStart: "2026-08-17",
    winterBreakStart: "2026-12-19",
    winterBreakEnd: "2027-01-05",
    springBreakStart: "2027-03-23",
    springBreakEnd: "2027-04-03",
    lastDay: "2027-06-12",
    status: "Pending",
  },
];
