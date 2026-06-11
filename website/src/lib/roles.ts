// Role visual system (1/ Sara, 5/17 Paula): a single source of truth for the
// colored accent + small role label that distinguishes who is signed in.
//
//   master_admin → purple   (the owner — Paula)
//   admin        → blue      (staff / general admin)
//   tutor        → green     (external tutors)
//   parent       → none      (neutral; the default client view)
//   student      → teal/green
//
// Replaces the old undifferentiated "Admin" badge. `accent` is a hex used for
// a thin top/side border; the class fields drive the small chip.
export type AppRole = "master_admin" | "admin" | "tutor" | "parent" | "student";

export interface RoleMeta {
  label: string;
  accent: string; // hex for borders/rails — "" = no accent (parent)
  chip: string; // tailwind classes for the small role chip
}

const META: Record<AppRole, RoleMeta> = {
  master_admin: {
    label: "Master Admin",
    accent: "#7030A0",
    chip: "bg-[#F2E8FA] text-[#7030A0] ring-1 ring-[#7030A0]/20",
  },
  admin: {
    label: "Staff Admin",
    accent: "#1d4ed8",
    chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  tutor: {
    label: "Tutor",
    accent: "#0F7B6C",
    chip: "bg-[#E0F2F0] text-[#0F7B6C] ring-1 ring-[#0F7B6C]/20",
  },
  parent: {
    label: "Parent",
    accent: "",
    chip: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  },
  student: {
    label: "Student",
    accent: "#0F7B6C",
    chip: "bg-[#E0F2F0] text-[#0F7B6C] ring-1 ring-[#0F7B6C]/20",
  },
};

export function roleMeta(role: string | null | undefined): RoleMeta {
  return META[(role as AppRole) ?? "parent"] ?? META.parent;
}
