// F-2/C-10: S3 location parsing — every supported URL shape must resolve to
// {bucket, key}, and everything else must be rejected (a non-match falls back
// to a plain redirect, never a bucket read).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseS3Url } from "./s3.ts";

describe("parseS3Url", () => {
  test("s3:// scheme", () => {
    assert.deepEqual(parseS3Url("s3://my-bucket/contracts/smith.pdf"), {
      bucket: "my-bucket",
      key: "contracts/smith.pdf",
    });
  });

  test("virtual-hosted-style https URL", () => {
    assert.deepEqual(
      parseS3Url("https://my-bucket.s3.us-west-2.amazonaws.com/a/b.pdf"),
      { bucket: "my-bucket", key: "a/b.pdf" },
    );
  });

  test("legacy global virtual-hosted URL", () => {
    assert.deepEqual(parseS3Url("https://my-bucket.s3.amazonaws.com/k.pdf"), {
      bucket: "my-bucket",
      key: "k.pdf",
    });
  });

  test("path-style https URL", () => {
    assert.deepEqual(
      parseS3Url("https://s3.us-west-2.amazonaws.com/my-bucket/x/y.pdf"),
      { bucket: "my-bucket", key: "x/y.pdf" },
    );
  });

  test("URL-encoded keys are decoded", () => {
    assert.deepEqual(
      parseS3Url("s3://b/folder/My%20File.pdf"),
      { bucket: "b", key: "folder/My File.pdf" },
    );
  });

  test("non-S3 URLs are rejected", () => {
    assert.equal(parseS3Url("https://drive.google.com/file/d/abc"), null);
    assert.equal(parseS3Url("https://example.com/s3.amazonaws.com/fake"), null);
    assert.equal(parseS3Url("https://my-bucket.s3.evil.com/key"), null);
    assert.equal(parseS3Url(""), null);
    assert.equal(parseS3Url("not a url"), null);
  });

  test("s3:// without a key is rejected", () => {
    assert.equal(parseS3Url("s3://bucket-only"), null);
  });
});
