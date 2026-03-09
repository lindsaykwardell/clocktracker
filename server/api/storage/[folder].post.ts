import sharp from "sharp";
import http from "http";
import formidable from "formidable";
import { v4 as uuid } from "uuid";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: "https://fly.storage.tigris.dev",
});

const folders = new Map<
  string,
  { resize: (input: sharp.Sharp) => sharp.Sharp }
>();

folders.set("events", {
  resize: (image) => image.resize(600, null),
});

folders.set("avatars", {
  resize: (image) => image.resize(300, 300, { fit: "cover" }),
});

folders.set("game-attachments", {
  resize: (image) => image.resize(800, null),
});

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const files = await processImage(handler.node.req);
  const folder = handler.context.params?.folder as string;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (folders.get(folder) === undefined) {
    throw createError({
      status: 404,
      statusMessage: "Folder not found",
    });
  }

  const urls = await Promise.all(
    files.map((file) => uploadImage(folder, file))
  );

  return urls;
});

async function processImage(
  req: http.IncomingMessage
): Promise<formidable.File[]> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (error, _, files) => {
      if (error) {
        reject(error);
        return;
      }

      if (!files.file?.[0]) {
        reject(new Error("No file uploaded"));
        return;
      }

      resolve(files.file);
    });
  });
}

async function uploadImage(
  folder: string,
  file: formidable.File
): Promise<string> {
  const key = `${folder}/${uuid()}`;

  const pipeline = sharp(file.filepath);
  const resized = folders.get(folder)?.resize(pipeline) ?? pipeline;
  const buffer = await resized.jpeg().toBuffer();

  const upload = new Upload({
    client: S3,
    params: {
      Bucket: "clocktracker-storage",
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    },
  });

  await upload.done();

  return `https://fly.storage.tigris.dev/clocktracker-storage/${key}`;
}
