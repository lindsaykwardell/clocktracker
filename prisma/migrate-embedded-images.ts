import "dotenv/config";
import { Client } from "pg";
import { storeEmbeddedImage, storeScriptImages } from "../server/utils/embeddedImages";

async function main() {
  const db = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
    statement_timeout: 30_000,
    lock_timeout: 5_000,
  });
  await db.connect();
  try {
    await migrateEmbeddedImages(db);
  } finally {
    await db.end();
  }
}

export async function migrateEmbeddedImages(db: Client) {
  // A new database has no images to migrate yet.
  const tables = await db.query(`SELECT to_regclass('public."Role"') AS roles, to_regclass('public."Script"') AS scripts`);
  if (!tables.rows[0].roles || !tables.rows[0].scripts) return;

  const roles = await db.query<{ id: string; token_url: string; alternate_token_urls: string[] }>(`
    SELECT id, token_url, alternate_token_urls FROM "Role"
    WHERE token_url ILIKE 'data:%'
       OR EXISTS (SELECT 1 FROM unnest(alternate_token_urls) url WHERE url ILIKE 'data:%')
  `);
  for (const role of roles.rows) {
    const tokenUrl = await storeEmbeddedImage(role.token_url);
    const alternatives = [];
    for (const url of role.alternate_token_urls) alternatives.push(await storeEmbeddedImage(url));
    // Upload first, then replace only the values that were read. Retries reuse the same objects.
    const updated = await db.query(`
      UPDATE "Role" SET token_url = $1, alternate_token_urls = $2
      WHERE id = $3 AND token_url = $4 AND alternate_token_urls = $5
    `, [tokenUrl, alternatives, role.id, role.token_url, role.alternate_token_urls]);
    if (updated.rowCount !== 1) throw new Error("Role changed during image migration; retry the release.");
  }

  const scripts = await db.query<{ id: number; json: string | null; logo: string | null; background: string | null }>(`
    SELECT id, json, logo, background FROM "Script"
    WHERE json ILIKE '%data:%' OR logo ILIKE 'data:%' OR background ILIKE 'data:%'
  `);
  let scriptsUpdated = 0;
  for (const script of scripts.rows) {
    const body = script.json === null ? null : JSON.parse(script.json);
    if (body !== null) await storeScriptImages(body);
    const json = body === null ? null : JSON.stringify(body);
    const logo = script.logo === null ? null : await storeEmbeddedImage(script.logo);
    const background = script.background === null ? null : await storeEmbeddedImage(script.background);
    if (json === script.json && logo === script.logo && background === script.background) continue;
    const updated = await db.query(`
      UPDATE "Script" SET json = $1, logo = $2, background = $3
      WHERE id = $4 AND json IS NOT DISTINCT FROM $5
        AND logo IS NOT DISTINCT FROM $6 AND background IS NOT DISTINCT FROM $7
    `, [json, logo, background, script.id, script.json, script.logo, script.background]);
    if (updated.rowCount !== 1) throw new Error("Script changed during image migration; retry the release.");
    scriptsUpdated++;
  }
  console.log(`Embedded images migrated: ${roles.rowCount} roles, ${scriptsUpdated} scripts.`);
}

if (require.main === module) main().catch(() => {
  // Provider/database errors can contain credentials or embedded image data.
  console.error("Embedded image migration failed. Check database/Tigris access and image validity; staging requires a backup from after the production migration.");
  process.exitCode = 1;
});
