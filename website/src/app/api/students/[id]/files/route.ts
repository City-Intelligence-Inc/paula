import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  studentsForFamilyMember,
  tutorScopeForStudent,
} from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import type { Actor } from "@/lib/server/access";
import type { SharedFile, Student } from "@/lib/types";

// F-1/F-2: files shared with a student's family — link entries (Drive,
// Dropbox, …) stored on the student record. Staff and assigned tutors manage
// them here; families read the "family"-audience entries via /api/me/notes.

async function authorizeStaffOrTutor(
  actor: Actor,
  id: string,
): Promise<{ student: Student } | { response: Response }> {
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id } }),
  );
  const student = r.Item as Student | undefined;
  if (!student) {
    return { response: Response.json({ error: "Student not found" }, { status: 404 }) };
  }
  if (actor.isAdmin) return { student };
  if (actor.role === "tutor" && actor.tutor) {
    const scope = tutorScopeForStudent(student, actor.tutor.id);
    if (scope !== "none") return { student };
    return { response: forbidden("You are not assigned to this student.") };
  }
  return { response: forbidden() };
}

async function writeFiles(id: string, files: SharedFile[]) {
  await ddb().send(
    new UpdateCommand({
      TableName: Tables.students,
      Key: { id },
      UpdateExpression: "SET sharedFiles = :f, updatedAt = :n",
      ExpressionAttributeValues: {
        ":f": files,
        ":n": new Date().toISOString(),
      },
    }),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;
  const authz = await authorizeStaffOrTutor(actor!, id);
  if ("response" in authz) return authz.response;
  return Response.json({ files: authz.student.sharedFiles || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;
  // Staff/tutors add links with either audience. Family members may add
  // family-audience entries for their own student (N-6 comment uploads).
  let familyUpload = false;
  let authz = await authorizeStaffOrTutor(actor!, id);
  if ("response" in authz) {
    if (actor!.isAdmin || actor!.role === "tutor") return authz.response;
    const { parentOf, self } = await studentsForFamilyMember(
      actor!.userId,
      actor!.email,
    );
    const mine = parentOf.some((s) => s.id === id) || self?.id === id;
    if (!mine) return authz.response;
    const r = await ddb().send(
      new GetCommand({ TableName: Tables.students, Key: { id } }),
    );
    const student = r.Item as Student | undefined;
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    authz = { student };
    familyUpload = true;
  }

  let body: { name?: string; url?: string; audience?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = String(body.name || "").trim().slice(0, 200);
  const url = String(body.url || "").trim().slice(0, 2000);
  if (!name || !url) {
    return Response.json({ error: "name and url are required" }, { status: 400 });
  }
  if (!/^(https?|s3):\/\//i.test(url)) {
    return Response.json(
      { error: "url must start with http://, https://, or s3://" },
      { status: 400 },
    );
  }

  const file: SharedFile = {
    id: `f_${Date.now().toString(36)}`,
    name,
    url,
    audience: familyUpload
      ? "family"
      : body.audience === "staff"
        ? "staff"
        : "family",
    addedBy: actor!.userId,
    addedByName: actor!.tutor
      ? `${actor!.tutor.firstName} ${actor!.tutor.lastName}`.trim()
      : actor!.email || (familyUpload ? "Family" : "Staff"),
    createdAt: new Date().toISOString(),
  };
  const files = [...(authz.student.sharedFiles || []), file];
  await writeFiles(id, files);

  // F-1: uploads/links trigger an automated notification to the Mathitude
  // team (logged + emailed via Resend). Best-effort.
  notifyAction({
    kind: "file.shared",
    summary: `${file.addedByName} shared a file for ${authz.student.firstName} ${authz.student.lastName}: ${file.name}`,
    details: { studentId: id, fileId: file.id, audience: file.audience, storage: url.startsWith("s3://") ? "s3" : "link" },
  }).catch(() => {});

  return Response.json({ file, files }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;
  const authz = await authorizeStaffOrTutor(actor!, id);
  if ("response" in authz) return authz.response;

  const fileId = new URL(request.url).searchParams.get("fileId") || "";
  const existing = authz.student.sharedFiles || [];
  const target = existing.find((f) => f.id === fileId);
  if (!target) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
  // Tutors can only remove links they added; admins remove anything.
  if (!actor!.isAdmin && target.addedBy !== actor!.userId) {
    return forbidden("Tutors can only remove links they added.");
  }
  const files = existing.filter((f) => f.id !== fileId);
  await writeFiles(id, files);
  return Response.json({ ok: true, files });
}
