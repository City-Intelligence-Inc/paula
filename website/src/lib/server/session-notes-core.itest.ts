// Integration tests — exercise the real session-notes core against a local
// in-memory DynamoDB (dynalite). These prove BEHAVIOR (RBAC denials + actual
// persistence), not just rule constants. Run with dynalite up:
//
//   npm run db:local      # in one shell (dynalite on :8000)
//   npm run test:integration
//
// Named *.itest.ts so the default `npm test` (pure unit tests, no DB) skips it.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  listSessionNotes,
  upsertSessionNote,
  deleteSessionNote,
  setFamilyReply,
  addNoteComment,
  type NoteActor,
  type NoteDeps,
} from "./session-notes-core.ts";

const ENDPOINT = process.env.AWS_ENDPOINT_URL_DYNAMODB || "http://localhost:8000";
const tables = { sessions: "itest-sessions", students: "itest-students" };

let deps: NoteDeps;

const superAdmin: NoteActor = { userId: "sa", role: "master_admin", isAdmin: true, isMaster: true };
const officeStaff: NoteActor = { userId: "os", role: "admin", isAdmin: true, isMaster: false };
const parent: NoteActor = { userId: "pa", role: "parent", isAdmin: false, isMaster: false };
const tutorSam: NoteActor = { userId: "sam_uid", role: "tutor", isAdmin: false, isMaster: false, tutorId: "tutor_sam" };
const tutorUnassigned: NoteActor = { userId: "no_uid", role: "tutor", isAdmin: false, isMaster: false, tutorId: "tutor_none" };
const tutorLimited: NoteActor = { userId: "lim_uid", role: "tutor", isAdmin: false, isMaster: false, tutorId: "tutor_lim" };

before(async () => {
  const raw = new DynamoDBClient({
    endpoint: ENDPOINT,
    region: "us-west-2",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  const db = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
  deps = { db, tables };

  // Drop + recreate for a clean slate, so the suite is idempotent whether
  // dynalite is fresh or warm from a previous run.
  const mk = async (name: string, keys: { name: string; key: "HASH" | "RANGE" }[]) => {
    await raw
      .send(new DeleteTableCommand({ TableName: name }))
      .catch((e) => {
        if (!/not found|ResourceNotFound|does not exist/i.test(String(e))) throw e;
      });
    await raw.send(
      new CreateTableCommand({
        TableName: name,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: keys.map((k) => ({ AttributeName: k.name, AttributeType: "S" })),
        KeySchema: keys.map((k) => ({ AttributeName: k.name, KeyType: k.key })),
      }),
    );
  };

  await mk(tables.sessions, [
    { name: "studentId", key: "HASH" },
    { name: "dateTime", key: "RANGE" },
  ]);
  await mk(tables.students, [{ name: "id", key: "HASH" }]);

  // Seed students: Robin (tutor_sam, full) and a limited-scope class student.
  await db.send(new PutCommand({ TableName: tables.students, Item: { id: "stu_robin", tutorIds: ["tutor_sam"] } }));
  await db.send(
    new PutCommand({
      TableName: tables.students,
      Item: { id: "stu_class", tutorIds: ["tutor_lim"], tutorAccess: [{ tutorId: "tutor_lim", scope: "limited" }] },
    }),
  );
  // Two notes on the limited student: one by tutor_lim, one by someone else.
  for (const [dt, who] of [["2026-06-01T12:00:00.000Z", "lim_uid"], ["2026-06-08T12:00:00.000Z", "other_uid"]] as const) {
    await db.send(
      new PutCommand({
        TableName: tables.sessions,
        Item: { studentId: "stu_class", dateTime: dt, date: dt.slice(0, 10), type: "session-note", createdBy: who, publicNotes: "x" },
      }),
    );
  }
});

// ─────────────────────────────────────────────
// upsertSessionNote — who can write (#4, R-5)
// ─────────────────────────────────────────────
describe("upsertSessionNote (RBAC + persistence)", () => {
  test("super admin → 201 and the row truly persists with private notes", async () => {
    const r = await upsertSessionNote(superAdmin, "stu_robin", {
      dateTime: "2026-06-20T12:00:00.000Z",
      publicNotes: "<b>great session</b>",
      privateNotes: "internal only",
    }, deps);
    assert.equal(r.status, 201);
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_robin", dateTime: "2026-06-20T12:00:00.000Z" },
    }));
    assert.equal(got.Item?.type, "session-note");
    assert.equal(got.Item?.privateNotes, "internal only");
  });

  test("re-submitting the same dateTime edits in place → 200 (editable, not append)", async () => {
    const r = await upsertSessionNote(superAdmin, "stu_robin", {
      dateTime: "2026-06-20T12:00:00.000Z",
      publicNotes: "edited",
    }, deps);
    assert.equal(r.status, 200);
  });

  test("office staff → 403 (view-only on notes)", async () => {
    const r = await upsertSessionNote(officeStaff, "stu_robin", { publicNotes: "x" }, deps);
    assert.equal(r.status, 403);
  });

  test("parent → 403 (cannot write here)", async () => {
    const r = await upsertSessionNote(parent, "stu_robin", { publicNotes: "x" }, deps);
    assert.equal(r.status, 403);
  });

  test("assigned tutor → 201", async () => {
    const r = await upsertSessionNote(tutorSam, "stu_robin", {
      dateTime: "2026-06-21T12:00:00.000Z", publicNotes: "tutor note",
    }, deps);
    assert.equal(r.status, 201);
  });

  test("unassigned tutor → 403 (not in this student's portfolio, R-5)", async () => {
    const r = await upsertSessionNote(tutorUnassigned, "stu_robin", { publicNotes: "x" }, deps);
    assert.equal(r.status, 403);
  });
});

// ─────────────────────────────────────────────
// listSessionNotes — who can read + scope filtering
// ─────────────────────────────────────────────
describe("listSessionNotes (read access + scope)", () => {
  test("super admin reads notes for the student → 200", async () => {
    const r = await listSessionNotes(superAdmin, "stu_robin", deps);
    assert.equal(r.status, 200);
    const notes = (r.body as { notes: unknown[] }).notes;
    assert.ok(notes.length >= 1);
  });

  test("parent cannot read via this staff/tutor route → 403", async () => {
    const r = await listSessionNotes(parent, "stu_robin", deps);
    assert.equal(r.status, 403);
  });

  test("limited tutor sees only their OWN notes on a class student", async () => {
    const r = await listSessionNotes(tutorLimited, "stu_class", deps);
    assert.equal(r.status, 200);
    const notes = (r.body as { notes: { createdBy: string }[] }).notes;
    assert.equal(notes.length, 1);
    assert.equal(notes[0].createdBy, "lim_uid");
  });
});

// ─────────────────────────────────────────────
// deleteSessionNote — who can delete
// ─────────────────────────────────────────────
describe("deleteSessionNote (RBAC + persistence)", () => {
  test("office staff → 403 (view-only on notes)", async () => {
    const r = await deleteSessionNote(officeStaff, "stu_robin", "2026-06-20T12:00:00.000Z", deps);
    assert.equal(r.status, 403);
  });

  test("parent → 403 (cannot delete via the staff path)", async () => {
    const r = await deleteSessionNote(parent, "stu_robin", "2026-06-20T12:00:00.000Z", deps);
    assert.equal(r.status, 403);
  });

  test("limited tutor cannot delete someone else's note → 403", async () => {
    const r = await deleteSessionNote(tutorLimited, "stu_class", "2026-06-08T12:00:00.000Z", deps);
    assert.equal(r.status, 403);
  });

  test("limited tutor deletes their OWN note → 200 and the row is gone", async () => {
    const r = await deleteSessionNote(tutorLimited, "stu_class", "2026-06-01T12:00:00.000Z", deps);
    assert.equal(r.status, 200);
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_class", dateTime: "2026-06-01T12:00:00.000Z" },
    }));
    assert.equal(got.Item, undefined);
  });

  test("super admin deletes any note → 200 and the row is gone", async () => {
    const r = await deleteSessionNote(superAdmin, "stu_robin", "2026-06-20T12:00:00.000Z", deps);
    assert.equal(r.status, 200);
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_robin", dateTime: "2026-06-20T12:00:00.000Z" },
    }));
    assert.equal(got.Item, undefined);
  });

  test("missing note → 404", async () => {
    const r = await deleteSessionNote(superAdmin, "stu_robin", "1999-01-01T00:00:00.000Z", deps);
    assert.equal(r.status, 404);
  });
});

// ─────────────────────────────────────────────
// setFamilyReply — N-5 parent reply
// ─────────────────────────────────────────────
describe("setFamilyReply (N-5 RBAC + persistence)", () => {
  const noteDT = "2026-06-21T12:00:00.000Z"; // tutor note on stu_robin from above

  test("parent replies on their own child → 200, persists, staff fields stripped", async () => {
    const r = await setFamilyReply(parent, ["stu_robin"], "stu_robin", {
      dateTime: noteDT,
      familyReply: "Thanks — she loved this session!",
    }, deps);
    assert.equal(r.status, 200);
    const body = r.body as { note: Record<string, unknown> };
    assert.equal(body.note.familyReply, "Thanks — she loved this session!");
    assert.equal(body.note.privateNotes, undefined); // stripped for family
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_robin", dateTime: noteDT },
    }));
    assert.equal(got.Item?.familyReply, "Thanks — she loved this session!");
    assert.equal(got.Item?.familyReplyBy, "pa");
  });

  test("parent cannot reply on someone else's child → 403", async () => {
    const r = await setFamilyReply(parent, ["stu_other"], "stu_robin", {
      dateTime: noteDT, familyReply: "nope",
    }, deps);
    assert.equal(r.status, 403);
  });

  test("staff cannot write a family reply → 403", async () => {
    const r = await setFamilyReply(superAdmin, ["stu_robin"], "stu_robin", {
      dateTime: noteDT, familyReply: "staff reply",
    }, deps);
    assert.equal(r.status, 403);
  });

  test("reply on a missing note → 404", async () => {
    const r = await setFamilyReply(parent, ["stu_robin"], "stu_robin", {
      dateTime: "1999-01-01T00:00:00.000Z", familyReply: "x",
    }, deps);
    assert.equal(r.status, 404);
  });
});

// ─────────────────────────────────────────────
// addNoteComment — N-6 shared thread
// ─────────────────────────────────────────────
describe("addNoteComment (N-6 RBAC + persistence)", () => {
  const noteDT = "2026-06-21T12:00:00.000Z"; // tutor note on stu_robin

  test("assigned tutor comments → 201, thread persists", async () => {
    const r = await addNoteComment(tutorSam, [], "stu_robin", {
      dateTime: noteDT, text: "Great progress on fractions today.", authorName: "Sam T",
    }, deps);
    assert.equal(r.status, 201);
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_robin", dateTime: noteDT },
    }));
    const comments = got.Item?.comments as { authorName: string; authorRole: string }[];
    assert.equal(comments.length, 1);
    assert.equal(comments[0].authorName, "Sam T");
    assert.equal(comments[0].authorRole, "tutor");
  });

  test("parent comments on own child → 201, appended after tutor's", async () => {
    const r = await addNoteComment(parent, ["stu_robin"], "stu_robin", {
      dateTime: noteDT, text: "Thank you!", authorName: "Pat P",
    }, deps);
    assert.equal(r.status, 201);
    const got = await deps.db.send(new GetCommand({
      TableName: tables.sessions,
      Key: { studentId: "stu_robin", dateTime: noteDT },
    }));
    const comments = got.Item?.comments as { authorRole: string }[];
    assert.equal(comments.length, 2);
    assert.equal(comments[1].authorRole, "parent");
  });

  test("parent cannot comment on someone else's child → 403", async () => {
    const r = await addNoteComment(parent, ["stu_other"], "stu_robin", {
      dateTime: noteDT, text: "nope",
    }, deps);
    assert.equal(r.status, 403);
  });

  test("unassigned tutor → 403", async () => {
    const r = await addNoteComment(tutorUnassigned, [], "stu_robin", {
      dateTime: noteDT, text: "hi",
    }, deps);
    assert.equal(r.status, 403);
  });

  test("office staff (view-only on notes) CAN comment → 201", async () => {
    const r = await addNoteComment(officeStaff, [], "stu_robin", {
      dateTime: noteDT, text: "Scheduling note: next week moves to Tuesday.", authorName: "Sara",
    }, deps);
    assert.equal(r.status, 201);
  });

  test("empty text → 400", async () => {
    const r = await addNoteComment(tutorSam, [], "stu_robin", {
      dateTime: noteDT, text: "   ",
    }, deps);
    assert.equal(r.status, 400);
  });
});
