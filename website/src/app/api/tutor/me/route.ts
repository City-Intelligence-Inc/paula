import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

// GET /api/tutor/me
// Resolves the current Clerk user to their Tutor record. Matching priority:
//   1. tutors.clerkUserId === auth.userId  (explicit link, set by admin)
//   2. tutors.email matches one of the user's verified Clerk emails
//
// Returns 404 if no tutor record matches. The /tutor portal uses this to
// figure out which students to load.
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.userId!;

  const c = ddb();
  const cu = await currentUser().catch(() => null);
  const emails = (cu?.emailAddresses || [])
    .map((e) => e.emailAddress?.toLowerCase())
    .filter(Boolean) as string[];

  const r = await c.send(new ScanCommand({ TableName: Tables.tutors }));
  const tutors = (r.Items as Record<string, unknown>[]) || [];

  const byClerk = tutors.find((t) => t.clerkUserId === userId) || null;
  const byEmail =
    byClerk ||
    tutors.find(
      (t) =>
        typeof t.email === "string" &&
        emails.includes((t.email as string).toLowerCase()),
    ) ||
    null;

  if (!byEmail) {
    return Response.json(
      { error: "No tutor record matched the signed-in user" },
      { status: 404 },
    );
  }
  return Response.json({ tutor: byEmail });
}
