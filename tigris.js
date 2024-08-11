const dotenv = require("dotenv");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const {
  S3Client,
  ListBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const axios = require("axios");
const Jimp = require("jimp");
const ProgressBar = require("progress");

dotenv.config({
  path: path.resolve(process.cwd(), ".env.production"),
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const S3 = new S3Client({
  region: "auto",
  endpoint: "https://fly.storage.tigris.dev",
});

const folders = new Map();

folders.set("events", {
  resize: (image) => image.resize(600, Jimp.AUTO),
});

folders.set("avatars", {
  resize: (image) => {
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
  resize: (image) => image.resize(600, Jimp.AUTO),
});

async function main() {
  for (const folder of folders.keys()) {
    await fetchFiles(folder);
  }
}

async function fetchFiles(folder) {
  console.log(`Fetching files from ${folder}...`);
  const { data, error } = await supabase.storage
    .from(folder)
    .list(undefined, { limit: 1000 });

  if (error) {
    console.error("Error listing files", error.message);
    return;
  }

  const pageBar = new ProgressBar(":current / :total [:bar] :elapseds", {
    total: data.length,
  });

  for (const file of data) {
    await download(file, folder).catch((err) => null);

    pageBar.tick();
  }
}

async function download(file, folder) {
  const filename = file.name;
  const mimetype = file.metadata.mime_type;

  const res = await supabase.storage.from(folder).download(file.name);

  if (res.error) {
    console.error(" Error downloading file", res.error.message);
    return;
  }

  // blob is a blob, we'll need to transform it into a buffer
  const blob = await res.data;

  const params = await (async () => {
    try {
      const image = await Jimp.read(await blob.arrayBuffer());
      const { resize } = folders.get(folder);
      resize(image);

      return {
        Bucket: "clocktracker-storage",
        Key: `${folder}/${filename}`,
        Body: await image.getBufferAsync(Jimp.MIME_JPEG),
        ContentType: Jimp.MIME_JPEG,
      };
    } catch (err) {
      return {
        Bucket: "clocktracker-storage",
        Key: `${folder}/${filename}`,
        Body: blob,
        ContentType: mimetype,
      };
    }
  })();

  const upload = new Upload({
    client: S3,
    params,
  });

  await upload.done();
}

main();
