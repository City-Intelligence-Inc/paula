import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import {
  resolveActor,
  studentsForFamilyMember,
  allUserEmails,
  forbidden,
} from "@/lib/server/access";
import { notifyAction } from "@/lib/server/notify";
import type { Family, Parent } from "@/lib/types";

// POST /api/me/contract/accept — C-1 "Contract Gate": a parent records that
// they have read and accepted the family's contract. One acceptance per
// family unlocks the portal for everyone in it. Refuses when no contract is
// on file (nothing to accept) and never overwrites an earlier acceptance.

export async function POST() {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (a.role !== "parent") {
    return forbidden("Only parents accept the family contract.");
  }

  const { parentOf } = await studentsForFamilyMember(a.userId, a.email);
  const familyId = parentOf.find((s) => s.familyId)?.familyId;
  if (!familyId) {
    return Response.json({ error: "No family found for your account." }, { status: 404 });
  }

  const c = ddb();
  const fr = await c.send(
    new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
  );
  const family = fr.Item as Family | undefined;
  if (!family?.contractUrl) {
    return Response.json({ error: "No contract on file to accept." }, { status: 404 });
  }
  if (family.contractAcceptedAt) {
    return Response.json({ ok: true, acceptedAt: family.contractAcceptedAt });
  }

  // Resolve the accepting parent's display name for the audit trail.
  let name = a.email;
  try {
    const emails = await allUserEmails(a.email);
    const ps = await c.send(new ScanCommand({ TableName: Tables.parents }));
    const match = ((ps.Items || []) as Parent[]).find(
      (p) =>
        p.clerkUserId === a.userId ||
        emails.has((p.email || "").toLowerCase()),
    );
    if (match) name = `${match.firstName} ${match.lastName}`.trim() || a.email;
  } catch {}

  const now = new Date().toISOString();
  await c.send(
    new UpdateCommand({
      TableName: Tables.families,
      Key: { id: familyId },
      UpdateExpression:
        "SET contractAcceptedAt = :at, contractAcceptedBy = :by, contractAcceptedByName = :name",
      ConditionExpression: "attribute_not_exists(contractAcceptedAt)",
      ExpressionAttributeValues: {
        ":at": now,
        ":by": a.userId,
        ":name": name,
      },
    }),
  ).catch(() => {}); // condition race = someone else accepted first — fine

  await notifyAction({
    kind: "contract.accepted",
    summary: `${name} accepted the family contract`,
    details: { familyId, acceptedBy: a.userId },
  }).catch(() => {});

  return Response.json({ ok: true, acceptedAt: now });
}
