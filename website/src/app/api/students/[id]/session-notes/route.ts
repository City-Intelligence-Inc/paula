import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor } from "@/lib/server/access";
import {
  listSessionNotes,
  upsertSessionNote,
  type NoteActor,
  type NoteUpsertBody,
} from "@/lib/server/session-notes-core";

// Session Notes API (FEATURE_LIST N-1..N-9). Thin wrapper: resolve the Clerk
// actor, then delegate to the integration-tested core in
// lib/server/session-notes-core.ts. Notes are type:"session-note" items on the
// sessions table; reads are field-gated by role; only tutors + super admin
// write (#4). Parents/students read via the family dashboard path, not here.

const deps = () => ({ db: ddb(), tables: { sessions: Tables.sessions, students: Tables.students } });

function toNoteActor(a: {
  userId: string;
  role: "master_admin" | "admin" | "tutor" | "parent";
  isAdmin: boolean;
  isMaster: boolean;
  tutor: { id: string } | null;
}): NoteActor {
  return {
    userId: a.userId,
    role: a.role,
    isAdmin: a.isAdmin,
    isMaster: a.isMaster,
    tutorId: a.tutor?.id,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { actor, response } = await resolveActor();
  if (response) return response;
  const r = await listSessionNotes(toNoteActor(actor!), id, deps());
  return Response.json(r.body, { status: r.status });
}

async function write(request: Request, id: string) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  let body: NoteUpsertBody;
  try {
    body = (await request.json()) as NoteUpsertBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const r = await upsertSessionNote(toNoteActor(actor!), id, body, deps());
  return Response.json(r.body, { status: r.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return write(request, id);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return write(request, id);
}
