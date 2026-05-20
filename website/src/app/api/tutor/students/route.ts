import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

// GET /api/tutor/students
// Returns every Student whose tutorIds[] includes the signed-in user's
// resolved Tutor record. Resolution is the same priority as /api/tutor/me:
// clerkUserId link first, then verified-email match.
export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const userId = auth.userId!;

  const c = ddb();
  const cu = await currentUser().catch(() => null);
  const emails = (cu?.emailAddresses || [])
    .map((e) => e.emailAddress?.toLowerCase())
    .filter(Boolean) as string[];

  const tutorsR = await c.send(new ScanCommand({ TableName: Tables.tutors }));
  const tutors = (tutorsR.Items as Record<string, unknown>[]) || [];
  const tutor =
    tutors.find((t) => t.clerkUserId === userId) ||
    tutors.find(
      (t) =>
        typeof t.email === "string" &&
        emails.includes((t.email as string).toLowerCase()),
    );

  if (!tutor) {
    return Response.json({ tutor: null, students: [] });
  }

  const studentsR = await c.send(
    new ScanCommand({
      TableName: Tables.students,
      FilterExpression: "contains(tutorIds, :t)",
      ExpressionAttributeValues: { ":t": tutor.id },
    }),
  );

  const students = ((studentsR.Items as Record<string, unknown>[]) || [])
    .slice()
    .sort((a, b) => {
      const an = `${a.lastName || ""} ${a.firstName || ""}`.toLowerCase();
      const bn = `${b.lastName || ""} ${b.firstName || ""}`.toLowerCase();
      return an.localeCompare(bn);
    });

  return Response.json({ tutor, students });
}
