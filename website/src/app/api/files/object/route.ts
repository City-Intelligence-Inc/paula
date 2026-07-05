import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  forbidden,
  studentsForFamilyMember,
  tutorScopeForStudent,
} from "@/lib/server/access";
import { parseS3Url, streamS3Object } from "@/lib/server/s3";
import type { Student } from "@/lib/types";

// GET /api/files/object?sid=<studentId>&fid=<fileId> (F-2) — serve a shared
// file inline. S3 objects are streamed through the server so the bucket
// stays private and no AWS URL is ever exposed; non-S3 links redirect.
// Authorization mirrors the shared-files rules: staff always, tutors when
// assigned, family members only for their own student AND family-audience
// entries.

export async function GET(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;

  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sid") || "";
  const fid = searchParams.get("fid") || "";
  if (!sid || !fid) {
    return Response.json({ error: "sid and fid are required" }, { status: 400 });
  }

  const r = await ddb().send(
    new GetCommand({ TableName: Tables.students, Key: { id: sid } }),
  );
  const student = r.Item as Student | undefined;
  if (!student) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const file = (student.sharedFiles || []).find((f) => f.id === fid);
  if (!file) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!a.isAdmin) {
    if (a.role === "tutor") {
      if (!a.tutor || tutorScopeForStudent(student, a.tutor.id) === "none") {
        return forbidden();
      }
    } else {
      const { parentOf, self } = await studentsForFamilyMember(a.userId, a.email);
      const isFamily =
        parentOf.some((s) => s.id === sid) || self?.id === sid;
      if (!isFamily || file.audience !== "family") return forbidden();
    }
  }

  const s3loc = parseS3Url(file.url);
  if (s3loc) {
    try {
      return await streamS3Object(s3loc.bucket, s3loc.key, file.name);
    } catch (err) {
      console.error("[files/object] stream failed:", err);
      return Response.json({ error: "File could not be loaded" }, { status: 502 });
    }
  }
  return Response.redirect(file.url, 302);
}
