import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

interface TutorBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// GET /api/admin/tutors → list all tutors
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const result = await ddb().send(new ScanCommand({ TableName: Tables.tutors }));
  const tutors = (result.Items || [])
    .slice()
    .sort((a, b) => {
      const an = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
      const bn = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      return an.localeCompare(bn);
    });
  return Response.json({ tutors });
}

// POST /api/admin/tutors → create a new tutor
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: TutorBody;
  try {
    body = (await request.json()) as TutorBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    return Response.json(
      { error: "firstName and lastName required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const slug =
    slugify(`${body.firstName}_${body.lastName}`) || `t_${Date.now()}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  const tutor: Record<string, unknown> = {
    id: `tut_${slug}_${suffix}`,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  if (body.email?.trim()) tutor.email = body.email.trim();
  if (body.phone?.trim()) tutor.phone = body.phone.trim();

  try {
    await ddb().send(
      new PutCommand({ TableName: Tables.tutors, Item: tutor }),
    );
    await notifyAction({
      kind: "tutor.created",
      summary: `New tutor added: ${tutor.firstName} ${tutor.lastName}`,
      details: {
        tutorId: tutor.id as string,
        email: (tutor.email as string) || "—",
        phone: (tutor.phone as string) || "—",
      },
    }).catch(() => {});
    return Response.json({ tutor }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/tutors] failed:", err);
    return Response.json(
      { error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}
