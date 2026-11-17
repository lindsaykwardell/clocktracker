import { test } from "node:test";
import assert from "node:assert/strict";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { storeEmbeddedImage, storeScriptImages } from "../../server/utils/embeddedImages";

async function png() {
  const buffer = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

test("uploads valid images with stable keys and preserves transparency", async (t) => {
  const uploads: PutObjectCommand[] = [];
  t.mock.method(S3Client.prototype, "send", async (command: PutObjectCommand) => { uploads.push(command); });
  const input = await png();
  const first = await storeEmbeddedImage(input);
  assert.equal(await storeEmbeddedImage(input), first);
  assert.match(first, /^https:\/\/fly.storage.tigris.dev\/clocktracker-storage\/role-images\/[a-f0-9]{64}\.webp$/);
  assert.equal(uploads[0]!.input.ContentType, "image/webp");
  const decoded = await sharp(uploads[0]!.input.Body as Buffer).raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.channels, 4);
  assert.ok(decoded.data[3]! > 0 && decoded.data[3]! < 255);
});

test("normalizes primary, alternate, and metadata images in saved script JSON", async (t) => {
  t.mock.method(S3Client.prototype, "send", async () => {});
  const data = await png();
  const script = [
    { logo: data, background: data },
    "washerwoman",
    { image: data },
    { image: ["https://example.com/icon.png", data] },
  ];
  await storeScriptImages(script);
  assert.ok(!JSON.stringify(script).includes("data:image"));
  assert.ok(JSON.stringify(script).includes("https://example.com/icon.png"));
  assert.equal(script[1], "washerwoman");
});

test("accepts percent-encoded SVG images and rasterizes them", async (t) => {
  t.mock.method(S3Client.prototype, "send", async () => {});
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>';
  assert.match(await storeEmbeddedImage(`data:image/svg+xml,${encodeURIComponent(svg)}`), /\.webp$/);
});

test("rejects invalid or oversized images without uploading", async (t) => {
  const send = t.mock.method(S3Client.prototype, "send", async () => {});
  for (const input of ["data:text/html;base64,PHNjcmlwdD4=", "data:image/png;base64,!!!!", "data:image/png;base64,YWJj", "data:image/png,%ZZ"]) {
    await assert.rejects(storeEmbeddedImage(input), { statusCode: 400 });
  }
  await assert.rejects(storeEmbeddedImage(`data:image/png;base64,${"A".repeat(14 * 1024 * 1024)}`), { statusCode: 413 });
  assert.equal(send.mock.callCount(), 0);
});

test("staging cannot upload, but hosted URLs work without storage access", async (t) => {
  const send = t.mock.method(S3Client.prototype, "send", async () => {});
  const previous = process.env.STAGING;
  process.env.STAGING = "true";
  try {
    assert.equal(await storeEmbeddedImage("/img/role/good.webp"), "/img/role/good.webp");
    await assert.rejects(storeEmbeddedImage(await png()), { statusCode: 403 });
    assert.equal(send.mock.callCount(), 0);
  } finally {
    if (previous === undefined) delete process.env.STAGING;
    else process.env.STAGING = previous;
  }
});

test("storage failure does not replace the embedded source image", async (t) => {
  t.mock.method(S3Client.prototype, "send", async () => { throw new Error("Storage unavailable"); });
  const input = await png();
  const script = [{ image: input }];
  await assert.rejects(storeScriptImages(script), /Storage unavailable/);
  assert.equal(script[0]!.image, input);
});
