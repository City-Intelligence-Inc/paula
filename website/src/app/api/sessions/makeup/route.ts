import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireAdmin } from "@/lib/server/ddb";
import { notifyAction } from "@/lib/server/notify";

interface Body {
  studentId?: string;
  originalDateTime?: string; // the cancelled session this makeup is for
  date?: string; // YYYY-MM-DD for the makeup
  time?: string; // HH:MM
  duration?: number;
  tutorId?: string;
}

// POST /api/sessions/makeup
// Schedule a makeup session against an available makeup credit. The credit is
// the originally-cancelled session ({studentId, originalDateTime}) which must
// be cancelled + makeupEligible + makeupStatus "available". Creates a new
// scheduled session at zero charge (the makeup replaces an already-accounted
// session) linked back via makeupOfDateTime, and flips the credit to
// "scheduled" so it can't be reused.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { studentId, originalDateTime } = body;
  if (!studentId || !originalDateTime) {
    return Response.json(
      { error: "studentId and originalDateTime are required" },
      { status: 400 },
    );
  }
  if (!body.date || !body.time) {
    return Response.json(
      { error: "date and time for the makeup are required" },
      { status: 400 },
    );
  }

  const c = ddb();

  // Validate the credit.
  const origR = await c.send(
    new GetCommand({
      TableName: Tables.sessions,
      Key: { studentId, dateTime: originalDateTime },
    }),
  );
  const original = origR.Item as Record<string, unknown> | undefined;
  if (!original) {
    return Response.json({ error: "Original session not found" }, { status: 404 });
  }
  if (original.status !== "cancelled" || !original.makeupEligible) {
    return Response.json(
      { error: "That session is not an eligible makeup credit." },
      { status: 400 },
    );
  }
  if (original.makeupStatus === "scheduled") {
    return Response.json(
      { error: "A makeup has already been scheduled for this credit." },
      { status: 409 },
    );
  }

  const newDateTime = `${body.date}T${body.time}:00`;
  if (newDateTime === originalDateTime) {
    return Response.json(
      { error: "Pick a makeup time different from the original." },
      { status: 400 },
    );
  }

  // Don't clobber an existing session in the target slot.
  const clashR = await c.send(
    new GetCommand({
      TableName: Tables.sessions,
      Key: { studentId, dateTime: newDateTime },
    }),
  );
  if (clashR.Item) {
    return Response.json(
      { error: "A session already exists at that date/time for this student." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const makeup: Record<string, unknown> = {
    studentId,
    dateTime: newDateTime,
    date: body.date,
    time: body.time,
    duration:
      typeof body.duration === "number"
        ? body.duration
        : (original.duration as number) || 60,
    type: (original.type as string) === "group" ? "group" : "individual",
    status: "scheduled",
    offering: (original.offering as string) || "tutoring",
    amountCents: 0, // makeup is a no-charge replacement
    makeupOfDateTime: originalDateTime,
    notes: `Makeup for the session originally on ${original.date as string}.`,
    createdAt: now,
    updatedAt: now,
  };
  if (body.tutorId?.trim()) makeup.tutorId = body.tutorId.trim();
  else if (original.tutorId) makeup.tutorId = original.tutorId;

  // Write the makeup, then flip the credit to "scheduled".
  await c.send(new PutCommand({ TableName: Tables.sessions, Item: makeup }));
  await c.send(
    new PutCommand({
      TableName: Tables.sessions,
      Item: {
        ...original,
        makeupStatus: "scheduled",
        makeupSessionDateTime: newDateTime,
        updatedAt: now,
      },
    }),
  );

  await notifyAction({
    kind: "session.makeup_scheduled",
    summary: `Makeup scheduled for ${studentId}: ${body.date} ${body.time} (credit from ${original.date as string})`,
    details: {
      studentId,
      makeupDateTime: newDateTime,
      originalDateTime,
    },
  }).catch(() => {});

  return Response.json({ makeup, originalDateTime }, { status: 201 });
}
