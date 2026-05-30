import type { SchoolLogin } from "@/lib/types";

// Pure normalizer for "ghost-student" school-portal credentials. Extracted
// from the credentials route so it can be unit-tested without pulling in the
// AWS SDK or Clerk. Rules:
//  - Non-array / garbage input -> [].
//  - A row with neither a portal label nor a username is an empty row -> dropped.
//  - portal/username/url/notes are trimmed; PASSWORD is preserved verbatim
//    (leading/trailing spaces can be meaningful in a real password).
//  - Missing id is generated; existing id is retained.
//  - updatedAt is stamped server-side from `now` (never trust client clocks).
export function sanitizeSchoolLogins(input: unknown, now: string): SchoolLogin[] {
  if (!Array.isArray(input)) return [];
  const out: SchoolLogin[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const portal = typeof r.portal === "string" ? r.portal.trim() : "";
    const username = typeof r.username === "string" ? r.username.trim() : "";
    const password = typeof r.password === "string" ? r.password : "";
    if (!portal && !username) continue;
    out.push({
      id:
        typeof r.id === "string" && r.id
          ? r.id
          : `cred_${out.length}_${now.replace(/[^0-9]/g, "")}`,
      portal,
      url: typeof r.url === "string" ? r.url.trim() : undefined,
      username,
      password,
      notes: typeof r.notes === "string" ? r.notes.trim() : undefined,
      updatedAt: now,
    });
  }
  return out;
}
