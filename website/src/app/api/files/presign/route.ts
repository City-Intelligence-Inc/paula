import { resolveActor, forbidden, studentsForFamilyMember } from "@/lib/server/access";
import { presignUpload, uploadsBucket } from "@/lib/server/s3";

// POST /api/files/presign (F-1) — mint a short-lived direct-to-S3 upload URL.
// Staff and tutors upload anywhere; parents/students may upload only for a
// student in their own family (N-6 comment attachments). Requires the
// FILES_S3_BUCKET env var; without it the UI falls back to link-only sharing.

function sanitize(name: string): string {
  return (name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;

  const bucket = uploadsBucket();
  if (!bucket) {
    return Response.json(
      { error: "Direct uploads are not configured (FILES_S3_BUCKET unset). Paste a link instead." },
      { status: 501 },
    );
  }

  let body: { studentId?: string; filename?: string; contentType?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const studentId = (body.studentId || "").trim();
  if (!studentId) {
    return Response.json({ error: "studentId is required" }, { status: 400 });
  }

  if (!a.isAdmin && a.role !== "tutor") {
    // Family member: only for their own student (N-6 comment uploads).
    const { parentOf, self } = await studentsForFamilyMember(a.userId, a.email);
    const allowed =
      parentOf.some((s) => s.id === studentId) || self?.id === studentId;
    if (!allowed) return forbidden("You can only upload files for your own family.");
  }

  const filename = sanitize(body.filename || "file");
  const contentType = (body.contentType || "application/octet-stream").slice(0, 100);
  const key = `students/${studentId}/${Date.now().toString(36)}-${filename}`;

  const uploadUrl = await presignUpload(key, contentType);
  return Response.json({
    uploadUrl,
    s3Url: `s3://${bucket}/${key}`,
    contentType,
  });
}
