import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, forbidden } from "@/lib/server/access";
import type { Session } from "@/lib/types";

// POST /api/billing/hold — park a billable session out of the charge run
// (status → "hold"), or release it back (→ "completed"). Only sessions that
// are currently in the queue (completed / failed / hold) can be toggled —
// billed and scheduled sessions are untouchable here.
//
// Body: { studentId, dateTime, hold: boolean }

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden("Admin access required.");

  let body: { studentId?: string; dateTime?: string; hold?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { studentId, dateTime } = body;
  const hold = !!body.hold;
  if (!studentId || !dateTime) {
    return Response.json(
      { error: "studentId and dateTime are required" },
      { status: 400 },
    );
  }

  const c = ddb();
  const r = await c.send(
    new GetCommand({
      TableName: Tables.sessions,
      Key: { studentId, dateTime },
    }),
  );
  const session = r.Item as Session | undefined;
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  const eligible = ["completed", "failed", "hold"].includes(session.status);
  if (!eligible) {
    return Response.json(
      { error: `Can't ${hold ? "hold" : "release"} a "${session.status}" session.` },
      { status: 409 },
    );
  }

  if (hold) {
    await c.send(
      new UpdateCommand({
        TableName: Tables.sessions,
        Key: { studentId, dateTime },
        UpdateExpression: "SET #s = :s, holdAt = :now, holdBy = :who",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": "hold",
          ":now": new Date().toISOString(),
          ":who": actor!.email || actor!.userId,
        },
      }),
    );
  } else {
    await c.send(
      new UpdateCommand({
        TableName: Tables.sessions,
        Key: { studentId, dateTime },
        UpdateExpression: "SET #s = :s REMOVE holdAt, holdBy",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "completed" },
      }),
    );
  }
  return Response.json({ ok: true, status: hold ? "hold" : "completed" });
}
