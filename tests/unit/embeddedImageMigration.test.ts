import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { migrateEmbeddedImages } from "../../prisma/migrate-embedded-images";

// Run against an empty, disposable database; all test data is rolled back.
test("embedded image backfill against PostgreSQL", { skip: !process.env.IMAGE_MIGRATION_TEST_DATABASE_URL }, async (t) => {
  const db = new Client({ connectionString: process.env.IMAGE_MIGRATION_TEST_DATABASE_URL });
  await db.connect();
  await db.query("BEGIN");
  try {
    await t.test("empty database needs no storage access", async () => {
      await migrateEmbeddedImages(db);
    });
    await db.query(`
      CREATE TABLE "Role" (id text PRIMARY KEY, token_url text NOT NULL, alternate_token_urls text[] NOT NULL);
      CREATE TABLE "Script" (id integer PRIMARY KEY, json text, logo text, background text);
    `);
    const image = await sharp({ create: { width: 2, height: 2, channels: 4, background: "red" } }).png().toBuffer();
    const data = `data:image/png;base64,${image.toString("base64")}`;
    await db.query('INSERT INTO "Role" VALUES ($1, $2, $3)', ["custom", data, [data, "https://example.com/image.png"]]);
    await db.query('INSERT INTO "Script" VALUES (1, $1, $2, NULL)', [JSON.stringify([{ id: "_meta", logo: data }, { id: "custom", image: [data] }]), data]);

    await t.test("storage failure leaves original database values intact", async (t) => {
      t.mock.method(S3Client.prototype, "send", async () => { throw new Error("Storage unavailable"); });
      await assert.rejects(migrateEmbeddedImages(db), /Storage unavailable/);
      assert.equal((await db.query('SELECT token_url FROM "Role"')).rows[0].token_url, data);
    });

    await t.test("updates primary, alternate, and saved script images; reruns do no uploads", async (t) => {
      const send = t.mock.method(S3Client.prototype, "send", async () => {});
      await migrateEmbeddedImages(db);
      const role = (await db.query('SELECT * FROM "Role"')).rows[0];
      assert.match(role.token_url, /role-images\/.*\.webp$/);
      assert.equal(role.alternate_token_urls[0], role.token_url);
      assert.equal(role.alternate_token_urls[1], "https://example.com/image.png");
      const script = (await db.query('SELECT * FROM "Script"')).rows[0];
      assert.equal(script.logo, role.token_url);
      assert.ok(!script.json.includes("data:image"));
      const uploads = send.mock.callCount();
      await migrateEmbeddedImages(db);
      assert.equal(send.mock.callCount(), uploads);
      await db.query('CREATE INDEX ON "Role" (token_url)');
    });

    await t.test("concurrent role edits are not overwritten", async (t) => {
      await db.query('INSERT INTO "Role" VALUES ($1, $2, $3)', ["changed", data, []]);
      t.mock.method(S3Client.prototype, "send", async () => {
        await db.query('UPDATE "Role" SET token_url = $1 WHERE id = $2', ["https://example.com/new.png", "changed"]);
      });
      await assert.rejects(migrateEmbeddedImages(db), /Role changed/);
      assert.equal((await db.query('SELECT token_url FROM "Role" WHERE id = $1', ["changed"])).rows[0].token_url, "https://example.com/new.png");
    });
  } finally {
    await db.query("ROLLBACK");
    await db.end();
  }
});
