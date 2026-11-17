import { createHash } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createError } from "h3";
import sharp from "sharp";

const storage = new S3Client({
  region: "auto",
  endpoint: "https://fly.storage.tigris.dev",
});
const maxImageBytes = 10 * 1024 * 1024;

export async function storeEmbeddedImage(url: string): Promise<string> {
  if (!/^data:/i.test(url)) return url;
  if (process.env.STAGING === "true") {
    throw createError({ statusCode: 403, statusMessage: "Embedded image uploads are disabled in staging. Use a backup taken after the production image migration." });
  }
  if (url.length > Math.ceil(maxImageBytes * 4 / 3) + 256) {
    throw createError({ statusCode: 413, statusMessage: "Embedded image exceeds 10 MB." });
  }

  let image: Buffer;
  try {
    const match = /^data:image\/[a-z0-9.+-]+((?:;[^,]*)?),(.*)$/is.exec(url);
    if (!match) throw new Error("Invalid image data URL");
    const payload = decodeURIComponent(match[2]!);
    if (/;base64$/i.test(match[1]!)) {
      if (!/^[a-z0-9+/]*={0,2}$/i.test(payload) || payload.length % 4 === 1) {
        throw new Error("Invalid base64");
      }
      image = Buffer.from(payload, "base64");
    } else {
      image = Buffer.from(payload, "utf8");
    }
    if (!image.length || image.length > maxImageBytes) throw new Error("Invalid image size");
    // Re-encode to a safe image format while preserving transparency and animation.
    image = await sharp(image, { animated: true, limitInputPixels: 16_000_000 })
      .webp({ lossless: true }).toBuffer();
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid embedded image." });
  }

  const hash = createHash("sha256").update(image).digest("hex");
  const key = `role-images/${hash}.webp`;
  await storage.send(new PutObjectCommand({
    Bucket: "clocktracker-storage",
    Key: key,
    Body: image,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `https://fly.storage.tigris.dev/clocktracker-storage/${key}`;
}

type ScriptImageEntry = string | {
  image?: string | string[];
  logo?: string;
  background?: string;
};

export async function storeScriptImages(entries: ScriptImageEntry[]) {
  for (const entry of entries) {
    if (typeof entry === "string") continue;
    if (typeof entry.image === "string") {
      entry.image = await storeEmbeddedImage(entry.image);
    } else if (Array.isArray(entry.image)) {
      const images = [];
      for (const image of entry.image) images.push(await storeEmbeddedImage(image));
      entry.image = images;
    }
    if (entry.logo) entry.logo = await storeEmbeddedImage(entry.logo);
    if (entry.background) entry.background = await storeEmbeddedImage(entry.background);
  }
}
