// Session Notes — schema contract + role visibility + synthetic seed data.
//
// This file is the single source of truth for the Session Notes feature
// (FEATURE_LIST rows R-1..R-7 "Roles" and N-1..N-9 "Notes", plus the 6/20
// working-session decisions). It is deliberately backend-agnostic: the
// `SessionNote` shape below IS the production schema. The MVP UI runs on the
// SEED data at the bottom so it renders without Clerk/DynamoDB; Ari swaps the
// seed for `fetchApi("/api/students/:id/session-notes")` on his unrestricted
// account without changing any component. Keep the shapes stable.
//
// Mapping to Paula's real data (TEST2_MATHITUDE_NOTES example sheet):
//   sheet "SESSION ACTIVITIES"          -> sessionActivities
//   sheet "MATHITUDE ASSIGNMENTS/NOTES" -> publicNotes
//   (sessionPlan + privateNotes are the Excel side Paula keeps separately)

// ---------------------------------------------------------------------------
// The four note fields (spec N-1), ordered left -> right exactly as the
// STAFF_LOG_NOTES mockups show them.
// ---------------------------------------------------------------------------
export type NoteField =
  | "sessionPlan"
  | "privateNotes"
  | "sessionActivities"
  | "publicNotes";

export const NOTE_FIELD_ORDER: NoteField[] = [
  "sessionPlan",
  "privateNotes",
  "sessionActivities",
  "publicNotes",
];

export interface NoteFieldMeta {
  key: NoteField;
  label: string;
  /** placeholder shown in the empty input (matches the SWITCH_ON mockup) */
  placeholder: string;
  /** who ultimately sees this field, for the small caption under the header */
  audience: "Staff only" | "Shared with family";
}

export const NOTE_FIELDS: Record<NoteField, NoteFieldMeta> = {
  sessionPlan: {
    key: "sessionPlan",
    label: "Session Plan",
    placeholder: "Create session plan here…",
    audience: "Staff only",
  },
  privateNotes: {
    key: "privateNotes",
    label: "Private Notes",
    placeholder: "Private notes (never shown to families)…",
    audience: "Staff only",
  },
  sessionActivities: {
    key: "sessionActivities",
    label: "Session Activities",
    placeholder: "Record session activities here…",
    audience: "Shared with family",
  },
  publicNotes: {
    key: "publicNotes",
    label: "Public Notes",
    placeholder: "Write public notes here…",
    audience: "Shared with family",
  },
};

export interface SessionNoteFields {
  sessionPlan: string; // rich-text HTML
  privateNotes: string; // rich-text HTML
  sessionActivities: string; // rich-text HTML
  publicNotes: string; // rich-text HTML
}

export interface SessionNote extends SessionNoteFields {
  id: string;
  studentId: string;
  dateTime: string; // ISO — sort key (most recent first in the history view)
  date: string; // YYYY-MM-DD
  durationMin: number;
  createdBy: string; // author id (tutor/staff)
  updatedAt: string; // ISO
  noteGroupId?: string; // set on group sessions; shared fields match across the group
  groupLabel?: string; // display only, e.g. "Group: Robin + Milo"
}

// N-5 shortcut library entry (mirrors NoteResource in types.ts).
export interface NoteShortcut {
  id: string;
  shortcut: string; // searchable key, e.g. "Straws 1"
  label: string; // chip text
  href: string;
}

// How many history rows to show expanded before collapsing the rest (#5: most
// recent 5). The full history stays scrollable.
export const HISTORY_EXPANDED = 5;

// ---------------------------------------------------------------------------
// Roles (spec R-1..R-7). Five roles; the difference between portals is
// visibility only (6/20: "three-portal model … difference is visibility
// permissions only"). Names align to the spec wording; the existing codebase
// uses master_admin/admin — see ROLE_ALIASES for the bridge Ari can use.
// ---------------------------------------------------------------------------
export type PortalRole =
  | "super_admin"
  | "office_staff"
  | "tutor"
  | "parent"
  | "student";

export const ROLE_ALIASES: Record<string, PortalRole> = {
  master_admin: "super_admin",
  admin: "office_staff",
  super_admin: "super_admin",
  office_staff: "office_staff",
  tutor: "tutor",
  parent: "parent",
  student: "student",
};

export interface RoleMeta {
  role: PortalRole;
  label: string;
  accent: string; // hex used for the header role indicator (R-1)
}

export const ROLES: Record<PortalRole, RoleMeta> = {
  super_admin: { role: "super_admin", label: "Super Admin", accent: "#7030A0" },
  office_staff: { role: "office_staff", label: "Office Staff", accent: "#1d4ed8" },
  tutor: { role: "tutor", label: "Tutor", accent: "#0F7B6C" },
  parent: { role: "parent", label: "Parent", accent: "#6B6F76" },
  student: { role: "student", label: "Student", accent: "#2AB5B2" },
};

// Which note fields a role may SEE (R-3..R-7, N-8 staff = all four,
// N-9 parent/student = activities + public only).
export const VISIBLE_FIELDS: Record<PortalRole, NoteField[]> = {
  super_admin: NOTE_FIELD_ORDER,
  office_staff: NOTE_FIELD_ORDER,
  tutor: NOTE_FIELD_ORDER,
  parent: ["sessionActivities", "publicNotes"],
  student: ["sessionActivities", "publicNotes"],
};

// Who may author/edit notes (#4): only Tutors + Super Admin. Office staff can
// VIEW all four columns (N-8) but are view-only on notes; parents/students
// never author.
export const CAN_EDIT_NOTES: Record<PortalRole, boolean> = {
  super_admin: true,
  office_staff: false,
  tutor: true,
  parent: false,
  student: false,
};

// Who may see pricing/billing (R-4/R-5: staff + tutors are billing-blind;
// only super_admin and parent see money). Pairs with the existing
// stripPricingFromStudent/Session helpers in lib/server/access.ts.
export const CAN_SEE_BILLING: Record<PortalRole, boolean> = {
  super_admin: true,
  office_staff: false,
  tutor: false,
  parent: true,
  student: false,
};

/**
 * The columns to render, given the viewer's role and the staff "In-session
 * view" toggle. When a staff member flips the toggle ON (screen faces the
 * student/parent) the Private Notes column drops out and the rest expand —
 * spec N-3 / STAFF_LOG_NOTES_SWITCH_ON.png.
 */
export function columnsFor(role: PortalRole, inSessionView: boolean): NoteField[] {
  const base = VISIBLE_FIELDS[role];
  if (inSessionView) return base.filter((f) => f !== "privateNotes");
  return base;
}

export function normalizeRole(raw: string | null | undefined): PortalRole {
  return ROLE_ALIASES[(raw ?? "").toLowerCase()] ?? "parent";
}

export function emptyNoteFields(): SessionNoteFields {
  return {
    sessionPlan: "",
    privateNotes: "",
    sessionActivities: "",
    publicNotes: "",
  };
}

// ---------------------------------------------------------------------------
// Synthetic seed data. SYNTHETIC — no real students. Themed to Paula's actual
// math-enrichment activities so the layout reads true, but every name is
// invented. Ari replaces this with the real API response.
// ---------------------------------------------------------------------------
export interface DemoStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  school: string; // short abbreviation, 2–5 chars (e.g. "WCS", "PALY")
  rate: number; // dollars/hr — only shown to billing roles
  familyId: string; // R-2/R-6: parents see every child in their family
  tutorIds: string[]; // R-5: tutors see only their portfolio
}

export interface DemoFamily {
  id: string;
  name: string;
}
export interface DemoTutor {
  id: string;
  name: string;
  studentIds: string[];
}

// Two families + two tutors so scoping is demonstrable: a parent in the Avery
// family must NOT see the Chen child, and tutor Sam must NOT see tutor Jess's
// student.
export const DEMO_FAMILIES: DemoFamily[] = [
  { id: "fam_avery", name: "Avery family" },
  { id: "fam_chen", name: "Chen family" },
];

export const DEMO_STUDENTS: DemoStudent[] = [
  { id: "stu_robin", firstName: "Robin", lastName: "Avery", grade: "2nd", school: "WCS", rate: 150, familyId: "fam_avery", tutorIds: ["tutor_sam"] },
  { id: "stu_milo", firstName: "Milo", lastName: "Avery", grade: "4th", school: "WCS", rate: 150, familyId: "fam_avery", tutorIds: ["tutor_sam"] },
  { id: "stu_ada", firstName: "Ada", lastName: "Chen", grade: "3rd", school: "PALY", rate: 165, familyId: "fam_chen", tutorIds: ["tutor_jess"] },
];

export const DEMO_TUTORS: DemoTutor[] = [
  { id: "tutor_sam", name: "Sam Rivera", studentIds: ["stu_robin", "stu_milo"] },
  { id: "tutor_jess", name: "Jess Okafor", studentIds: ["stu_ada"] },
];

// Which students a viewer may see (R-2/R-5/R-6/R-7). Staff see everyone; a tutor
// sees only their portfolio; a parent sees only their family's children; a
// student sees only themselves. Mirrors the server-side scope checks Ari wires.
export function studentsVisibleTo(
  role: PortalRole,
  who: { tutorId?: string; familyId?: string; studentId?: string },
): DemoStudent[] {
  switch (role) {
    case "super_admin":
    case "office_staff":
      return DEMO_STUDENTS;
    case "tutor": {
      const t = DEMO_TUTORS.find((x) => x.id === who.tutorId);
      return DEMO_STUDENTS.filter((s) => !!t && t.studentIds.includes(s.id));
    }
    case "parent":
      return DEMO_STUDENTS.filter((s) => s.familyId === who.familyId);
    case "student":
      return DEMO_STUDENTS.filter((s) => s.id === who.studentId);
  }
}

function note(
  studentId: string,
  daysAgo: number,
  durationMin: number,
  f: SessionNoteFields,
): SessionNote {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  const iso = d.toISOString();
  return {
    id: `note_${studentId}_${daysAgo}`,
    studentId,
    dateTime: iso,
    date: iso.slice(0, 10),
    durationMin,
    createdBy: "tutor_paula",
    updatedAt: iso,
    ...f,
  };
}

// Most-recent-first ordering is applied at read time; seed in any order.
export const DEMO_NOTES: SessionNote[] = [
  note("stu_robin", 0, 60, {
    sessionPlan:
      "<ul><li>Warm-up: <b>Prime Climb</b> to revisit doubling</li><li>Intro Hitomezashi stitch project</li><li>If time: 100s chart skip-count by 2s</li></ul>",
    privateNotes:
      "Robin was tired last week — keep the warm-up short. Parent asked about screen time; mention the 2048 connection gently.",
    sessionActivities:
      "<ul><li>2048</li><li>Hitomezashi stitch project</li><li>100s chart skip count</li></ul>",
    publicNotes:
      "Robin really enjoyed <b>2048</b> today — it's a great introduction to doubling and powers of two. We started a longer-term Hitomezashi project based on a Numberphile video. Ask to play 2048 at home!",
  }),
  note("stu_robin", 7, 60, {
    sessionPlan:
      "<ul><li>Safari Park logic game (challenges 1–32)</li><li>Four-color map challenge</li></ul>",
    privateNotes: "Loves logic games — lean into these when energy is low.",
    sessionActivities: "<ul><li>Safari Park, 1–32</li><li>Map coloring, 4-color challenge</li></ul>",
    publicNotes:
      "Robin walked straight to the bookshelf and chose the Safari Park logic game — did really well! There are 60 challenges total, so we'll see how far the streak goes.",
  }),
  note("stu_robin", 14, 60, {
    sessionPlan: "<ul><li>Prime Climb</li><li>Ratuki card game</li></ul>",
    privateNotes: "Birthday week — keep it light and celebratory.",
    sessionActivities: "<ul><li>Prime Climb</li><li>Ratuki</li></ul>",
    publicNotes:
      "Robin did a great job with both games and was such a happy young mathematician after the birthday party. See you after the break!",
  }),
  note("stu_milo", 2, 45, {
    sessionPlan: "<ul><li>Polydrons &amp; nets — explore new 3D shapes</li><li>Cubby Cubes partitioning</li></ul>",
    privateNotes: "Milo had a cold last session; check in on energy first.",
    sessionActivities: "<ul><li>Polydrons &amp; nets</li><li>Cubby Cubes, partitioning 7</li></ul>",
    publicNotes:
      "Milo explored some brand-new 3D shapes today and built a full dodecahedron — impressive fine-motor work. Cubby Cubes is a great one to have at home.",
  }),
];

// A group/joint session (#1): shared Plan/Activities/Public across both kids,
// per-student Private Notes. Stored as one item per student, tied by groupId.
const GROUP_ID = "grp_robin_milo_1";
const sharedGroup = {
  sessionPlan: "<ul><li>Joint: <b>Quadrillion</b></li><li>Shapes &amp; nets</li><li>Pig (dice game)</li></ul>",
  sessionActivities: "<ul><li>Quadrillion</li><li>Shapes</li><li>Pig</li></ul>",
  publicNotes:
    "Robin and Milo had a joint session today. We took turns having a 'first day' — the boys rolled to decide who chose the first activity. Lovely collaboration on Quadrillion!",
};
DEMO_NOTES.push(
  {
    ...note("stu_robin", 4, 60, {
      ...sharedGroup,
      privateNotes: "Robin led well today — encourage him to let Milo go first sometimes.",
    }),
    id: "note_grp_robin",
    noteGroupId: GROUP_ID,
    groupLabel: "Group: Robin + Milo",
  },
  {
    ...note("stu_milo", 4, 60, {
      ...sharedGroup,
      privateNotes: "Milo a little shy in the pair; pair him with Robin again, it's working.",
    }),
    id: "note_grp_milo",
    noteGroupId: GROUP_ID,
    groupLabel: "Group: Robin + Milo",
  },
);

// Chen-family student (different family + tutor) so scoping has two sides.
DEMO_NOTES.push(
  note("stu_ada", 1, 45, {
    sessionPlan: "<ul><li>SET warm-up</li><li>Fraction war with Cuisenaire rods</li></ul>",
    privateNotes: "Ada races ahead — slow her down on the 'why', not just the answer.",
    sessionActivities: "<ul><li>SET</li><li>Cuisenaire fraction war</li></ul>",
    publicNotes:
      "Ada flew through SET today and is building real fluency with equivalent fractions using the rods. Lovely focus!",
  }),
  note("stu_ada", 8, 45, {
    sessionPlan: "<ul><li>Tangram challenges</li><li>Skip-counting bracelets</li></ul>",
    privateNotes: "Bring the harder tangram set next time.",
    sessionActivities: "<ul><li>Tangrams 1–10</li><li>Skip-count bracelets</li></ul>",
    publicNotes:
      "Ada solved all ten tangram challenges and started a skip-counting bracelet she wants to finish at home.",
  }),
);

export function demoNotesForStudent(studentId: string): SessionNote[] {
  return DEMO_NOTES.filter((n) => n.studentId === studentId).sort((a, b) =>
    b.dateTime.localeCompare(a.dateTime),
  );
}

// SYNTHETIC N-5 shortcuts (Paula's real examples were "Straws 1/2", "Spacers
// for the Rhombi ball"). Ari swaps for GET /api/note-resources.
export const DEMO_SHORTCUTS: NoteShortcut[] = [
  { id: "sc1", shortcut: "Straws 1", label: "Straws 1 — intro build", href: "https://example.com/straws-1" },
  { id: "sc2", shortcut: "Straws 2", label: "Straws 2 — advanced", href: "https://example.com/straws-2" },
  { id: "sc3", shortcut: "Spacers (Rhombi ball)", label: "Spacers for the Rhombi ball", href: "https://example.com/rhombi-spacers" },
  { id: "sc4", shortcut: "Prime Climb", label: "Prime Climb (board)", href: "https://example.com/prime-climb" },
  { id: "sc5", shortcut: "Numberphile — Hitomezashi", label: "Numberphile: Hitomezashi", href: "https://youtube.com/watch?v=JbfhzlMk2eY" },
];
