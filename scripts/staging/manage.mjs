#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm, cp, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { lifetime, validateId, names, extendedExpiry, validateAuth } from "./policy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const required = name => {
  const value = process.env[name];
  if (!value || /[\r\n]/.test(value)) throw new Error(`Missing or invalid ${name}`);
  return value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const domain = required("STAGING_DOMAIN");
const bucket = required("STAGING_STATE_BUCKET");
const s3 = new S3Client({ region: "auto", endpoint: "https://fly.storage.tigris.dev" });
const stateKey = id => `staging/v1/${validateId(id)}.json`;
const save = state => s3.send(new PutObjectCommand({ Bucket: bucket, Key: stateKey(state.id), Body: JSON.stringify(state), ContentType: "application/json" }));
async function load(id) {
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: stateKey(id) }));
  const state = JSON.parse(await result.Body.transformToString());
  if (state.id !== id || state.domain !== domain || !Number.isFinite(state.expiresAt)) throw new Error("Invalid environment state");
  return state;
}
async function states() {
  const result = [];
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "staging/v1/", ContinuationToken: token }));
    for (const item of page.Contents ?? []) {
      const match = item.Key.match(/^staging\/v1\/([a-f0-9]{16})\.json$/);
      if (match) result.push(await load(match[1]));
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return result;
}
// Never forward command output: Fly restore/attach prints database passwords.
// Use subprocess arrays (no shell), bounded execution, and a minimal environment.
function fly(args, { input, cwd, timeout = 15 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("flyctl", args, { cwd, env: {
      PATH: process.env.PATH, HOME: process.env.HOME,
      FLY_API_TOKEN: required("FLY_API_TOKEN"), CI: "true", NO_COLOR: "1",
    }, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); }, timeout);
    child.stdout.on("data", chunk => { output = (output + chunk).slice(-8_000_000); });
    child.stderr.on("data", () => {});
    child.on("error", () => { clearTimeout(timer); reject(new Error("Unable to run flyctl")); });
    child.on("close", code => {
      clearTimeout(timer);
      code === 0 ? resolve(output) : reject(new Error(`Fly ${args.slice(0, 2).join(" ")} failed; inspect the private Fly dashboard (output suppressed)`));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
async function request(url, token, method = "GET", body, missingOK = false) {
  const response = await fetch(url, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60_000),
  });
  if (missingOK && response.status === 404) return null;
  if (!response.ok) throw new Error(`Infrastructure API ${method} failed (${response.status}); response suppressed`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const flyAPI = (route, method, body, missingOK) => request(`https://api.machines.dev/v1${route}`, required("FLY_API_TOKEN"), method, body, missingOK);
async function dns(route = "", method = "GET", body) {
  const response = await request(`https://api.cloudflare.com/client/v4/zones/${required("CLOUDFLARE_ZONE_ID")}/dns_records${route}`, required("CLOUDFLARE_API_TOKEN"), method, body);
  if (!response.success) throw new Error("Cloudflare DNS request failed");
  return response.result;
}
async function summary(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
async function sql(db, database, input) {
  const output = await fly(["postgres", "connect", "-a", db, "-d", database], { input: `\\set ON_ERROR_STOP on\n${input}\n\\echo STAGING_SQL_OK\n\\q\n` });
  if (!output.includes("STAGING_SQL_OK")) throw new Error("Staging database preparation failed; output suppressed");
}
async function destroy(state) {
  const n = names(state.id, domain);
  // DNS removal first avoids dangling records pointing at a released app name.
  for (const hostname of [n.hostname, `_fly-ownership.${n.hostname}`, `_acme-challenge.${n.hostname}`]) {
    const records = await dns(`?name=${encodeURIComponent(hostname)}`);
    for (const record of records) {
      if (record.comment !== `clocktracker-staging:${state.id}`) throw new Error("Refusing to delete an unowned DNS record");
      await dns(`/${record.id}`, "DELETE");
    }
  }
  for (const app of [n.app, n.db]) {
    const exists = await flyAPI(`/apps/${app}`, "GET", undefined, true);
    if (!exists) continue;
    // Explicitly remove volumes; stopping machines alone continues storage billing.
    for (const machine of await flyAPI(`/apps/${app}/machines`)) await flyAPI(`/apps/${app}/machines/${machine.id}?force=true`, "DELETE", undefined, true);
    for (const volume of await flyAPI(`/apps/${app}/volumes`)) await flyAPI(`/apps/${app}/volumes/${volume.id}`, "DELETE", undefined, true);
    await flyAPI(`/apps/${app}`, "DELETE", undefined, true);
  }
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: stateKey(state.id) }));
  await summary(`Destroyed staging environment ${state.id}.`);
}
async function up() {
  const hours = lifetime(process.env.STAGING_HOURS ?? "1");
  const source = path.resolve(required("STAGING_SOURCE_DIR"));
  const sourceDb = required("STAGING_SOURCE_DATABASE_APP");
  const database = required("STAGING_DATABASE_NAME");
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(database)) throw new Error("Invalid database name");
  const backup = process.env.STAGING_BACKUP || "latest";
  if (!/^(latest|\d{8}T\d{6})$/.test(backup)) throw new Error("Backup must be latest or a Barman backup ID");
  validateAuth(required("SUPABASE_URL"), required("SUPABASE_KEY"));
  required("FLY_ORG");
  const region = process.env.STAGING_REGION || "sjc";
  if (!/^[a-z0-9]{3}$/.test(region)) throw new Error("Invalid Fly region");
  // Old branches must merge the staging access controls before being deployed.
  for (const file of ["server/middleware/auth.ts", "server/utils/stagingAccess.ts", "nuxt.config.ts"]) {
    const expected = await readFile(path.resolve(here, "../..", file), "utf8");
    if (await readFile(path.join(source, file), "utf8") !== expected) throw new Error(`Branch must include the current staging controls: ${file}`);
  }
  const id = randomBytes(8).toString("hex");
  const n = names(id, domain);
  if (sourceDb.startsWith("ct-stg-")) throw new Error("Restore source must be the configured production backup source");
  const state = { id, domain, ref: process.env.STAGING_REF || "unspecified", backup, createdAt: Date.now(), expiresAt: Date.now() + 2 * 3600000, status: "provisioning" };
  // Journal before creating anything. Cancellation is recovered by the sweeper.
  await save(state);
  const temp = await mkdtemp(path.join(tmpdir(), "ct-staging-"));
  try {
    await summary(`Provisioning staging environment ${id}.`);
    await flyAPI("/apps", "POST", { app_name: n.app, org_slug: required("FLY_ORG") });
    await fly(["postgres", "backup", "restore", n.db, "-a", sourceDb, "--restore-target-name", backup], { timeout: 45 * 60_000 });
    await sql(n.db, database, await readFile(path.join(here, "sanitize.sql"), "utf8"));
    // Restore needs source backup access temporarily; remove it before app launch.
    await fly(["secrets", "unset", "S3_ARCHIVE_REMOTE_RESTORE_CONFIG", "-a", n.db]);
    const dbUser = `staging_${id}`;
    await fly(["postgres", "attach", n.db, "-a", n.app, "--database-name", database, "--database-user", dbUser, "--superuser=false", "--yes"]);
    // Give the fresh role ownership for migrations without cluster superuser access.
    await sql(n.db, database, `
ALTER DATABASE "${database}" OWNER TO "${dbUser}";
ALTER SCHEMA public OWNER TO "${dbUser}";
SELECT format('ALTER TABLE %I.%I OWNER TO %I', schemaname, tablename, '${dbUser}') FROM pg_tables WHERE schemaname = 'public' \\gexec
SELECT format('ALTER SEQUENCE %I.%I OWNER TO %I', sequence_schema, sequence_name, '${dbUser}') FROM information_schema.sequences WHERE sequence_schema = 'public' \\gexec
SELECT format('ALTER TYPE %I.%I OWNER TO %I', n.nspname, t.typname, '${dbUser}') FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e' \\gexec
`);
    await fly(["secrets", "import", "-a", n.app, "--stage"], { input: `SUPABASE_URL=${required("SUPABASE_URL")}\nSUPABASE_KEY=${required("SUPABASE_KEY")}\nSTAGING_EXPIRES_AT=${new Date(state.expiresAt).toISOString()}\n` });
    await cp(path.join(here, "Dockerfile"), path.join(source, "Dockerfile.staging"));
    const config = path.join(temp, "fly.toml");
    await writeFile(config, `app = "${n.app}"
primary_region = "${region}"
[build]
  dockerfile = "Dockerfile.staging"
[env]
  STAGING = "true"
  PORT = "8080"
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "off"
  auto_start_machines = true
  min_machines_running = 1
[[vm]]
  memory = "1024mb"
  cpu_kind = "shared"
  cpus = 1
[deploy]
  release_command = "npx prisma migrate deploy"
`);
    await fly(["deploy", "--config", config, "--remote-only", "--ha=false", "--build-secret", `SUPABASE_URL=${required("SUPABASE_URL")}`, "--build-secret", `SUPABASE_KEY=${required("SUPABASE_KEY")}`], { cwd: source, timeout: 30 * 60_000 });
    // IPv6 enables domain validation; shared IPv4 serves IPv4 clients without a dedicated IP charge.
    const addresses = JSON.parse(await fly(["ips", "list", "-a", n.app, "--json"]));
    if (!addresses.some(ip => ip.Type === "v6")) await fly(["ips", "allocate-v6", "-a", n.app]);
    if (!addresses.some(ip => ip.Type === "v4" || ip.Type === "shared_v4")) await fly(["ips", "allocate-v4", "--shared", "-a", n.app]);
    await fly(["certs", "add", n.hostname, "-a", n.app]);
    await dns("", "POST", { type: "CNAME", name: n.hostname, content: `${n.app}.fly.dev`, ttl: 60, proxied: false, comment: `clocktracker-staging:${id}` });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(`https://${n.hostname}/login`, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
        if (response.ok) { ready = true; break; }
      } catch { /* DNS propagation and certificate issuance are asynchronous. */ }
      await sleep(10_000);
    }
    if (!ready) throw new Error("DNS, certificate, or application readiness timed out");
    const readyAt = Date.now();
    state.readyAt = readyAt;
    state.expiresAt = readyAt + hours * 3600000;
    state.status = "ready";
    // Persist first so a crash cannot leave an untracked longer-lived instance.
    await save(state);
    await fly(["secrets", "import", "-a", n.app], { input: `STAGING_EXPIRES_AT=${new Date(state.expiresAt).toISOString()}\n` });
    await summary(`Ready: https://${n.hostname}\nEnvironment: ${id}\nExpires: ${new Date(state.expiresAt).toISOString()}\nBackup selection: ${backup}`);
  } catch (error) {
    try { await destroy(state); } catch { await summary(`Cleanup pending for ${id}; the scheduled sweeper will retry. Check the private provider dashboards.`); }
    throw error;
  } finally {
    await rm(temp, { recursive: true, force: true });
    await rm(path.join(source, "Dockerfile.staging"), { force: true });
  }
}
async function main() {
  switch (process.argv[2]) {
    case "up": return up();
    case "list":
      for (const state of await states()) await summary(`${state.id}: ${state.status}, ref ${JSON.stringify(state.ref)}, backup ${state.backup}, expires ${new Date(state.expiresAt).toISOString()}`);
      return;
    case "destroy": return destroy(await load(validateId(required("STAGING_ID"))));
    case "extend": {
      const state = await load(validateId(required("STAGING_ID")));
      state.expiresAt = extendedExpiry(state, process.env.STAGING_HOURS ?? "1");
      await save(state);
      await fly(["secrets", "import", "-a", names(state.id, domain).app], { input: `STAGING_EXPIRES_AT=${new Date(state.expiresAt).toISOString()}\n` });
      return summary(`Extended ${state.id} until ${new Date(state.expiresAt).toISOString()}.`);
    }
    case "cleanup": {
      let failed = false;
      for (const state of await states()) {
        if (state.expiresAt > Date.now()) continue;
        try { await destroy(state); } catch { failed = true; await summary(`Cleanup failed for ${state.id}; retry required.`); }
      }
      if (failed) throw new Error("Some environments could not be cleaned up");
      return;
    }
    default: throw new Error("Choose up, list, destroy, extend, or cleanup");
  }
}
main().catch(error => {
  // SDK error text can contain private bucket identifiers; never emit it publicly.
  console.error(error instanceof Error && error.constructor === Error ? error.message : "Staging operation failed; inspect private infrastructure configuration.");
  process.exitCode = 1;
});
