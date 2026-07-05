import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "@/lib/server/ddb";
import { resolveActor, studentsForFamilyMember, forbidden } from "@/lib/server/access";
import { parseS3Url, streamS3Object } from "@/lib/server/s3";
import type { Family } from "@/lib/types";

// C-10: the signed contract, fetched for the signed-in parent's own family.
// GET            → { hasContract } (existence check for the dashboard button)
// GET ?file=1    → streams the PDF (S3 objects are streamed server-side so
//                  the AWS URL never reaches the browser; other URLs redirect)

async function familyForActor(userId: string, email: string): Promise<Family | null> {
  const { parentOf } = await studentsForFamilyMember(userId, email);
  const familyId = parentOf.find((s) => s.familyId)?.familyId;
  if (!familyId) return null;
  const r = await ddb().send(
    new GetCommand({ TableName: Tables.families, Key: { id: familyId } }),
  );
  return (r.Item as Family) || null;
}

export async function GET(request: Request) {
  const { actor, response } = await resolveActor();
  if (response) return response;
  const a = actor!;
  if (a.role !== "parent" && !a.isAdmin) {
    return forbidden("The contract view is for family accounts.");
  }

  const family = await familyForActor(a.userId, a.email);
  const contractUrl = family?.contractUrl || "";
  const wantsFile = new URL(request.url).searchParams.get("file") === "1";

  if (!wantsFile) {
    return Response.json({ hasContract: !!contractUrl });
  }
  if (!contractUrl) {
    return Response.json({ error: "No contract on file" }, { status: 404 });
  }

  const s3loc = parseS3Url(contractUrl);
  if (s3loc) {
    try {
      return await streamS3Object(s3loc.bucket, s3loc.key, "mathitude-contract.pdf");
    } catch (err) {
      console.error("[me/contract] S3 stream failed:", err);
      return Response.json(
        { error: "Contract could not be loaded" },
        { status: 502 },
      );
    }
  }
  return Response.redirect(contractUrl, 302);
}
