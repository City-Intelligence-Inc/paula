import { resolveActor, forbidden } from "@/lib/server/access";
import {
  getResendAudienceId,
  setResendAudienceId,
  getResendAudienceKey,
  setResendAudienceKey,
  upsertContact,
  listContacts,
} from "@/lib/server/contacts";
import { notifyAction } from "@/lib/server/notify";

// One-click mailing-list bootstrap (master only). Runs server-side where
// RESEND_API_KEY already lives:
//   1. Creates the "Mathitude" audience in Resend if none is configured
//      (ID persisted in the DDB secrets table — no env var needed).
//   2. Upserts any seed emails from the body as contacts (source: manual),
//      which mirrors them into the audience via the normal sync.
//   3. Re-syncs every existing contact that hasn't reached the list yet.
//
// GET returns configuration status for the admin UI.

export async function GET() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isAdmin) return forbidden();
  const audienceId = await getResendAudienceId();
  return Response.json({
    configured: !!audienceId,
    hasApiKey: !!(process.env.RESEND_API_KEY || "").trim(),
  });
}

export async function POST(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  if (!actor!.isMaster) {
    return forbidden("Only the super admin can set up the mailing list.");
  }

  let body: {
    seedEmails?: { email: string; name?: string }[];
    apiKey?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {} // empty body is fine

  // The env key is sending-only; audience management needs a full-access key
  // pasted once by the super admin. Stored in the secrets table (encrypted
  // at rest), never echoed back.
  if (body.apiKey?.trim()) {
    if (!body.apiKey.trim().startsWith("re_")) {
      return Response.json(
        { error: "That doesn't look like a Resend API key (re_…)." },
        { status: 400 },
      );
    }
    await setResendAudienceKey(body.apiKey, actor!.email || actor!.userId);
  }

  const apiKey = await getResendAudienceKey();
  if (!apiKey) {
    return Response.json(
      { error: "No Resend API key available on the server." },
      { status: 503 },
    );
  }

  // 1. Ensure the audience exists.
  let audienceId = await getResendAudienceId();
  let created = false;
  if (!audienceId) {
    const res = await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Mathitude" }),
    });
    const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !j.id) {
      return Response.json(
        { error: `Could not create audience: ${j.message || res.status}` },
        { status: 502 },
      );
    }
    audienceId = j.id;
    created = true;
    await setResendAudienceId(audienceId, actor!.email || actor!.userId);
  }

  // 2. Seed the provided emails as contacts (normal upsert path → auto-sync).
  let seeded = 0;
  for (const s of body.seedEmails || []) {
    const email = (s.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    await upsertContact({
      email,
      name: s.name,
      source: "manual",
      logEntry: {
        by: actor!.email || "admin",
        kind: "system",
        text: "Added to the mailing list during setup.",
      },
    });
    seeded += 1;
  }

  // 3. Re-sync existing contacts that never reached the list. upsertContact
  // re-runs the audience push and stamps the sync result.
  const contacts = await listContacts();
  let resynced = 0;
  for (const c of contacts) {
    if (c.mailingListSyncedAt) continue;
    await upsertContact({ email: c.email });
    resynced += 1;
  }

  await notifyAction({
    kind: "mailing-list.setup",
    summary: `Mailing list ${created ? "created" : "verified"} — ${seeded} seeded, ${resynced} re-synced`,
    details: { audienceId, seeded, resynced },
  }).catch(() => {});

  return Response.json({ ok: true, audienceId, created, seeded, resynced });
}
