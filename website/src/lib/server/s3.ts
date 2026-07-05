import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Shared S3 helpers (F-1/F-2/C-10). The app never hands a raw AWS URL to the
// browser — objects are streamed through API routes (or short-lived presigned
// URLs are minted server-side for direct-to-bucket uploads).

let _s3: S3Client | null = null;
export function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({ region: process.env.AWS_REGION || "us-west-2" });
  }
  return _s3;
}

// The uploads bucket (F-1 drag-and-drop). Optional: when unset, file sharing
// stays in link-only mode and upload routes report 501.
export function uploadsBucket(): string {
  return (process.env.FILES_S3_BUCKET || "").trim();
}

// Parse anything that looks like an S3 location into { bucket, key }:
//   s3://bucket/key
//   https://bucket.s3.region.amazonaws.com/key
//   https://s3.region.amazonaws.com/bucket/key
export function parseS3Url(url: string): { bucket: string; key: string } | null {
  const v = (url || "").trim();
  const s3Scheme = v.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (s3Scheme) return { bucket: s3Scheme[1], key: decodeURIComponent(s3Scheme[2]) };
  try {
    const u = new URL(v);
    const vhost = u.hostname.match(/^([^.]+)\.s3[.-][^.]*\.?amazonaws\.com$/) ||
      u.hostname.match(/^([^.]+)\.s3\.amazonaws\.com$/);
    if (vhost) {
      return { bucket: vhost[1], key: decodeURIComponent(u.pathname.replace(/^\//, "")) };
    }
    if (/^s3[.-][^.]*\.?amazonaws\.com$/.test(u.hostname) || u.hostname === "s3.amazonaws.com") {
      const [bucket, ...rest] = u.pathname.replace(/^\//, "").split("/");
      if (bucket && rest.length) {
        return { bucket, key: decodeURIComponent(rest.join("/")) };
      }
    }
  } catch {
    // not a URL
  }
  return null;
}

// Stream an S3 object through the server (keeps the bucket private and the
// AWS URL out of the browser — F-2).
export async function streamS3Object(
  bucket: string,
  key: string,
  fallbackName?: string,
): Promise<Response> {
  const obj = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = obj.Body as { transformToWebStream?: () => ReadableStream } | undefined;
  const stream = body?.transformToWebStream?.();
  if (!stream) {
    return Response.json({ error: "Object has no body" }, { status: 502 });
  }
  const name = fallbackName || key.split("/").pop() || "file";
  return new Response(stream, {
    headers: {
      "Content-Type": obj.ContentType || "application/octet-stream",
      ...(obj.ContentLength ? { "Content-Length": String(obj.ContentLength) } : {}),
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

// Presigned PUT for direct browser → bucket uploads (F-1). 10-minute window.
export async function presignUpload(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: uploadsBucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );
}
