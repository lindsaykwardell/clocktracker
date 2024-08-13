import Jimp from "jimp";
import http from "http";
import formidable from "formidable";
import { v4 as uuid } from "uuid";
import { User } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: "https://fly.storage.tigris.dev",
});

const folders = new Map();

folders.set("events", {
  resize: (image: Jimp) => image.resize(600, Jimp.AUTO),
});

folders.set("avatars", {
  resize: (image: Jimp) => {
    const height = image.bitmap.height;
    const width = image.bitmap.width;

    if (height > width && width > 300) {
      image.resize(300, Jimp.AUTO);
    } else if (height <= width && height > 300) {
      image.resize(Jimp.AUTO, 300);
    }

    image.cover(300, 300);
  },
});

folders.set("game-attachments", {
  resize: (image: Jimp) => image.resize(800, Jimp.AUTO),
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

  const image = await Jimp.read(file.filepath);
  const resized = folders.get(folder)?.resize(image) || image;
  const buffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

  const upload = new Upload({
    client: S3,
    params: {
      Bucket: "clocktracker-storage",
      Key: key,
      Body: buffer,
      ContentType: Jimp.MIME_JPEG,
    },
  });

  await upload.done();

  return `https://fly.storage.tigris.dev/clocktracker-storage/${key}`;
}
