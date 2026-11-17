import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

async function fixture(run) {
  const dir = await mkdtemp(path.join(tmpdir(), "ct-lifecycle-test-"));
  const store = path.join(dir, "store.json");
  const source = path.join(dir, "source");
  await mkdir(path.join(source, "server/utils"), { recursive: true });
  await mkdir(path.join(source, "server/middleware"), { recursive: true });
  for (const file of ["nuxt.config.ts", "server/middleware/auth.ts", "server/utils/stagingAccess.ts"]) await cp(path.join(root, file), path.join(source, file));
  await writeFile(store, JSON.stringify({ objects: {}, apps: {}, dns: [], calls: [], fail: "" }));
  const sdk = import.meta.resolve("@aws-sdk/client-s3");
  const preload = path.join(dir, "preload.mjs");
  await writeFile(preload, `
import fs from 'node:fs';
import { S3Client } from ${JSON.stringify(sdk)};
const file = ${JSON.stringify(store)};
const get = () => JSON.parse(fs.readFileSync(file));
const save = s => fs.writeFileSync(file, JSON.stringify(s));
S3Client.prototype.send = async function(command) {
  const s=get(), i=command.input;
  switch(command.constructor.name) {
    case 'PutObjectCommand': s.objects[i.Key]=i.Body; save(s); return {};
    case 'GetObjectCommand': if(!s.objects[i.Key]) throw Error('Missing test object'); return {Body:{transformToString:async()=>s.objects[i.Key]}};
    case 'ListObjectsV2Command': return {Contents:Object.keys(s.objects).map(Key=>({Key}))};
    case 'DeleteObjectCommand': delete s.objects[i.Key]; save(s); return {};
    default: throw Error('Unexpected S3 command');
  }
};
globalThis.fetch = async (url, options={}) => {
  const s=get(), u=new URL(url), method=options.method||'GET';
  s.calls.push([method,u.pathname]);
  let data;
  if(u.hostname==='api.cloudflare.com') {
    if(s.fail==='dns-delete' && method==='DELETE') {save(s); return new Response('{}',{status:503});}
    if(method==='POST') {data={...JSON.parse(options.body),id:String(s.dns.length+1)};s.dns.push(data);}
    else if(method==='DELETE') {s.dns=s.dns.filter(r=>r.id!==u.pathname.split('/').at(-1));data={};}
    else data=s.dns.filter(r=>r.name===u.searchParams.get('name'));
    data={success:true,result:data};
  } else if(u.hostname==='api.machines.dev') {
    const [, , , app, resource]=u.pathname.split('/');
    if(s.fail==='volume-delete' && resource==='volumes' && method==='DELETE') {save(s); return new Response('{}',{status:503});}
    if(u.pathname==='/v1/apps' && method==='POST') {const name=JSON.parse(options.body).app_name;s.apps[name]={machines:[],volumes:[]};data={name};}
    else if(!s.apps[app]) {save(s);return new Response('{}',{status:404});}
    else if(method==='GET') data=resource?s.apps[app][resource]:{name:app};
    else if(method==='DELETE' && !resource) {delete s.apps[app];data={};}
    else if(method==='DELETE') {s.apps[app][resource]=[];data={};}
  } else if((u.hostname.endsWith('.staging.example.com') || u.hostname==='clocktracker-staging.fly.dev')) {if(s.fail==='readiness'){save(s);return new Response('{}',{status:503});}data={};}
  else throw Error('Unexpected network access in test');
  save(s); return new Response(JSON.stringify(data),{status:200});
};
`);
  await writeFile(path.join(dir, "flyctl"), `#!/usr/bin/env node
const fs=require('node:fs');
const file=${JSON.stringify(store)}, s=JSON.parse(fs.readFileSync(file)), args=process.argv.slice(2);
s.calls.push(['fly',...args]);
if(args[0]==='postgres' && args[1]==='backup') s.apps[args[3]]={machines:[{id:'db-machine',state:'started',checks:[{name:'role',status:'passing',output:'primary'}]}],volumes:[{id:'db-volume'}]};
if(s.fail==='restore-empty' && args[0]==='postgres' && args[1]==='backup') s.apps[args[3]].machines=[];
if(args[0]==='deploy') {
  if(s.fail==='deploy') {fs.writeFileSync(file,JSON.stringify(s));process.exit(1);}
  const configPath=args[args.indexOf('--config')+1];
  const config=fs.readFileSync(configPath,'utf8');
  const dockerfile=JSON.parse(config.match(/dockerfile = (.+)/)[1]);
  const path=require('node:path');
  if(path.isAbsolute(dockerfile) || !fs.existsSync(path.resolve(path.dirname(configPath),dockerfile))) throw Error('Dockerfile must resolve relative to the Fly config');
  if(!config.includes('npx prisma migrate deploy')) throw Error('Missing migration release command');
  const app=config.match(/app = "([^"]+)"/)[1];s.apps[app].machines=[{id:'app-machine'}];
}
fs.writeFileSync(file,JSON.stringify(s));
if(args[0]==='ips' && args[1]==='list') {console.log('[]');process.exit(0);}
if(args[0]==='postgres' && args[1]==='connect') {
  if(s.fail==='connect') {console.error('error connecting to SSH server SECRET_TEST_PASSWORD_MUST_NOT_APPEAR');process.exit(1);}
  process.stdin.resume();process.stdin.on('end',()=>console.log('STAGING_SQL_OK'));
} else {console.log('SECRET_TEST_PASSWORD_MUST_NOT_APPEAR');process.exit(0);}
`, { mode: 0o755 });
  const invoke = (action, extra = {}) => spawnSync(process.execPath, ["--import", preload, path.join(here, "manage.mjs"), action], {
    cwd: root, encoding: "utf8", timeout: 30_000,
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FLY_API_TOKEN: "test", FLY_ORG: "test",
      STAGING_DOMAIN: "staging.example.com", STAGING_STATE_BUCKET: "test-state", STAGING_SOURCE_DIR: source,
      STAGING_SOURCE_DATABASE_APP: "production-test-source", STAGING_DATABASE_NAME: "clocktracker",
      CLOUDFLARE_ZONE_ID: "test-zone", CLOUDFLARE_API_TOKEN: "test", SUPABASE_URL: "https://example.supabase.co", SUPABASE_KEY: "sb_publishable_test",
      STAGING_STABLE_ENABLED: "true", STAGING_ENABLED: "true", STAGING_HOURS: "1", GITHUB_STEP_SUMMARY: "", ...extra },
  });
  const read = async () => JSON.parse(await readFile(store, "utf8"));
  const update = async fn => {const state=await read();fn(state);await writeFile(store,JSON.stringify(state));};
  try { await run({invoke,read,update,source}); } finally { await rm(dir, {recursive:true,force:true}); }
}

test("two launches remain isolated; destroy removes only one environment and its volumes/DNS", async () => {
  await fixture(async ({ invoke, read }) => {
    for(let i=0;i<2;i++) {
      const result=invoke('up');assert.equal(result.status,0,result.stderr);
      assert.ok(!result.stdout.includes('SECRET_TEST_PASSWORD'));
    }
    let state=await read();assert.equal(Object.keys(state.objects).length,2);assert.equal(Object.keys(state.apps).length,4);
    const id=JSON.parse(Object.values(state.objects)[0]).id;
    assert.equal(invoke('destroy',{STAGING_ID:id}).status,0);
    state=await read();assert.equal(Object.keys(state.objects).length,1);assert.equal(Object.keys(state.apps).length,2);assert.equal(state.dns.length,1);
    assert.ok(state.calls.some(call=>call[0]==='DELETE' && call[1].endsWith('/volumes/db-volume')));
    assert.ok(!state.calls.some(call=>call[0]==='DELETE' && call[1].includes('production-test-source')));
  });
});
test("failed launch cleans up partially provisioned resources and suppresses credential output", async () => {
  await fixture(async ({invoke,update,read}) => {
    await update(s=>s.fail='deploy');
    const result=invoke('up');assert.equal(result.status,1);assert.ok(!result.stdout.includes('SECRET_TEST_PASSWORD'));
    const state=await read();assert.equal(Object.keys(state.objects).length,0);assert.equal(Object.keys(state.apps).length,0);
  });
});
test("cleanup retains failed journals for retry and ignores active environments", async () => {
  await fixture(async ({invoke,update,read}) => {
    assert.equal(invoke('up').status,0);
    assert.equal(invoke('cleanup').status,0);assert.equal(Object.keys((await read()).apps).length,2);
    await update(s=>{for(const k of Object.keys(s.objects)){const state=JSON.parse(s.objects[k]);state.expiresAt=0;s.objects[k]=JSON.stringify(state);}s.fail='dns-delete';});
    assert.equal(invoke('cleanup').status,1);assert.equal(Object.keys((await read()).objects).length,1);
    await update(s=>s.fail='');assert.equal(invoke('cleanup').status,0);assert.equal(Object.keys((await read()).apps).length,0);
  });
});

test("launch refuses to provision when scheduled cleanup has not been enabled", async () => {
  await fixture(async ({invoke,read}) => {
    assert.equal(invoke("up", {STAGING_ENABLED:"false"}).status, 1);
    const state=await read();
    assert.equal(Object.keys(state.objects).length,0);
    assert.equal(Object.keys(state.apps).length,0);
  });
});


test("fixed URL runs expire, retain only the app reservation, and restore again next run", async () => {
  await fixture(async ({invoke,read,update}) => {
    const env={STAGING_MODE:"stable", STAGING_DOMAIN:"", CLOUDFLARE_API_TOKEN:"", CLOUDFLARE_ZONE_ID:""};
    assert.equal(invoke("up",env).status,0);
    assert.equal(invoke("up",env).status,1);
    assert.equal(invoke("cleanup",env).status,0);
    assert.equal(Object.keys((await read()).apps).length,2);
    assert.equal(invoke("extend",{...env,STAGING_HOURS:"2"}).status,0);
    let state=await read();
    const journal=JSON.parse(Object.values(state.objects)[0]);
    assert.ok(journal.expiresAt > journal.readyAt);
    assert.ok(journal.expiresAt <= journal.readyAt + 168*3600000);
    assert.equal(invoke("cleanup").status,0);
    assert.equal(Object.keys((await read()).apps).length,2);
    await update(s=>{for(const k of Object.keys(s.objects)){const j=JSON.parse(s.objects[k]);j.expiresAt=0;s.objects[k]=JSON.stringify(j);}});
    assert.equal(invoke("cleanup",env).status,0);
    state=await read();
    assert.deepEqual(Object.keys(state.apps),["clocktracker-staging"]);
    assert.deepEqual(state.apps["clocktracker-staging"],{machines:[],volumes:[]});
    assert.equal(JSON.parse(Object.values(state.objects)[0]).status,"idle");
    assert.equal(invoke("extend",env).status,1);
    assert.equal(invoke("cleanup",env).status,0);
    assert.equal(invoke("up",env).status,0);
    state=await read();
    assert.equal(state.calls.filter(c=>c[0]==="fly" && c[1]==="postgres" && c[2]==="backup").length,2);
    assert.equal(state.calls.filter(c=>c[1]?.includes("/dns_records") || (c[0]==="fly" && c[1]==="certs")).length,0);
    assert.equal(state.calls.filter(c=>c[0]==="DELETE" && c[1]==="/v1/apps/clocktracker-staging").length,0);
    assert.ok(state.calls.some(c=>c[0]==="fly" && c[1]==="secrets" && c[2]==="unset" && c.includes("DATABASE_URL") && c.includes("--stage")));
    assert.equal(invoke("destroy",env).status,0);
    assert.equal(invoke("destroy",env).status,0);
  });
});

test("fixed URL launch failures remove compute and database but preserve the URL for retry", async () => {
  await fixture(async ({invoke,read,update}) => {
    const env={STAGING_MODE:"stable"};
    await update(s=>s.fail="deploy");
    const result=invoke("up",env);
    assert.equal(result.status,1);
    assert.ok(!result.stdout.includes("SECRET_TEST_PASSWORD"));
    assert.deepEqual(Object.keys((await read()).apps),["clocktracker-staging"]);
    await update(s=>s.fail="");
    assert.equal(invoke("up",env).status,0);
  });
});

test("fixed URL provisioning refuses to adopt an unjournaled app", async () => {
  await fixture(async ({invoke,read,update}) => {
    await update(s=>s.apps["clocktracker-staging"]={machines:[],volumes:[]});
    assert.equal(invoke("up",{STAGING_MODE:"stable"}).status,1);
    assert.equal(Object.keys((await read()).objects).length,0);
    assert.equal((await read()).calls.filter(c=>c[0]==="POST").length,0);
  });
});

test("fixed URL launches require cleanup opt-in and enforce lifetime bounds", async () => {
  await fixture(async ({invoke,read}) => {
    assert.equal(invoke("up",{STAGING_MODE:"stable",STAGING_STABLE_ENABLED:"false"}).status,1);
    for(const hours of ["0","169","1.5"]) assert.equal(invoke("up",{STAGING_MODE:"stable",STAGING_HOURS:hours}).status,1);
    assert.equal(Object.keys((await read()).objects).length,0);
    assert.equal(Object.keys((await read()).apps).length,0);
  });
});

test("fixed URL cleanup retains failed teardown for retry", async () => {
  await fixture(async ({invoke,read,update}) => {
    const env={STAGING_MODE:"stable"};
    assert.equal(invoke("up",env).status,0);
    await update(s=>s.fail="volume-delete");
    assert.equal(invoke("destroy",env).status,1);
    assert.equal(JSON.parse(Object.values((await read()).objects)[0]).status,"destroying");
    assert.equal(invoke("up",env).status,1);
    await update(s=>s.fail="");
    assert.equal(invoke("cleanup",env).status,0);
    assert.equal(JSON.parse(Object.values((await read()).objects)[0]).status,"idle");
    assert.deepEqual(Object.keys((await read()).apps),["clocktracker-staging"]);
  });
});


test("a successful restore exit without a machine never reaches SQL or deploy", async () => {
  await fixture(async ({invoke,read,update}) => {
    await update(s=>s.fail="restore-empty");
    const result=invoke("up",{STAGING_MODE:"stable"});
    assert.equal(result.status,1);
    assert.match(result.stderr,/restore created no machine/);
    const state=await read();
    assert.ok(!state.calls.some(c=>c[0]==="fly" && (c[1]==="deploy" || (c[1]==="postgres" && c[2]==="connect"))));
    assert.deepEqual(Object.keys(state.apps),["clocktracker-staging"]);
    assert.equal(JSON.parse(Object.values(state.objects)[0]).status,"idle");
  });
});

test("connection failures report a safe category and clean up the restored database", async () => {
  await fixture(async ({invoke,read,update}) => {
    await update(s=>s.fail="connect");
    const result=invoke("up",{STAGING_MODE:"stable"});
    assert.equal(result.status,1);
    assert.match(result.stderr,/private-network SSH connection failed/);
    assert.ok(!(result.stdout+result.stderr).includes("SECRET_TEST_PASSWORD"));
    const state=await read();
    assert.deepEqual(Object.keys(state.apps),["clocktracker-staging"]);
    assert.equal(JSON.parse(Object.values(state.objects)[0]).status,"idle");
  });
});


test("latest uses Fly's default restore target while explicit backup IDs are forwarded", async () => {
  await fixture(async ({invoke,read}) => {
    assert.equal(invoke("up",{STAGING_MODE:"stable",STAGING_BACKUP:"latest"}).status,0);
    assert.equal(invoke("destroy",{STAGING_MODE:"stable"}).status,0);
    assert.equal(invoke("up",{STAGING_MODE:"stable",STAGING_BACKUP:"20261103T175530"}).status,0);
    const restores=(await read()).calls.filter(c=>c[0]==="fly" && c[1]==="postgres" && c[2]==="backup");
    assert.equal(restores.length,2);
    assert.equal(restores[0].includes("--restore-target-name"),false);
    assert.equal(restores[0].includes("latest"),false);
    assert.deepEqual(restores[1].slice(-2),["--restore-target-name","20261103T175530"]);
  });
});

const stableEnv = {STAGING_MODE:"stable", STAGING_REF:"main"};
const journalOf = state => JSON.parse(Object.values(state.objects)[0]);

test("redeploy preserves database, snapshot and deadline while updating the selected ref", async () => {
  await fixture(async ({invoke,read,update}) => {
    assert.equal(invoke("up",stableEnv).status,0);
    const before=await read(), previous=journalOf(before);
    await update(s=>s.calls=[]);
    const result=invoke("redeploy",{...stableEnv,STAGING_REF:"feature/test",STAGING_HOURS:"168",STAGING_BACKUP:"ignored",STAGING_SOURCE_DATABASE_APP:"",STAGING_DATABASE_NAME:""});
    assert.equal(result.status,0,result.stderr);
    const after=await read(), current=journalOf(after);
    assert.deepEqual(after.apps["ct-stg-clocktracker-db"],before.apps["ct-stg-clocktracker-db"]);
    for(const key of ["expiresAt","readyAt","createdAt","backup"]) assert.equal(current[key],previous[key]);
    assert.equal(current.ref,"feature/test");assert.equal(current.status,"ready");
    assert.equal(after.calls.filter(c=>c[0]==="fly" && c[1]==="deploy").length,1);
    assert.ok(!after.calls.some(c=>c[0]==="DELETE" || c[0]==="POST" || (c[0]==="fly" && c[1]!=="deploy")));
    assert.ok(!(result.stdout+result.stderr).includes("SECRET_TEST_PASSWORD"));
  });
});

test("failed redeploy retains the database and deadline, allows retry, and remains cleanup eligible", async () => {
  await fixture(async ({invoke,read,update}) => {
    assert.equal(invoke("up",stableEnv).status,0);
    const before=await read();
    await update(s=>{s.fail="deploy";s.calls=[];});
    const failed=invoke("redeploy",{...stableEnv,STAGING_REF:"feature/failing"});
    assert.equal(failed.status,1);
    let state=await read();
    assert.deepEqual(state.apps,before.apps);
    assert.equal(journalOf(state).expiresAt,journalOf(before).expiresAt);
    assert.equal(journalOf(state).ref,"main");
    assert.equal(journalOf(state).pendingRef,"feature/failing");
    assert.equal(journalOf(state).status,"redeploy_failed");
    assert.ok(!state.calls.some(c=>c[0]==="DELETE"));
    await update(s=>s.fail="");
    assert.equal(invoke("redeploy",stableEnv).status,0);
    assert.equal(journalOf(await read()).pendingRef,undefined);
    await update(s=>{const key=Object.keys(s.objects)[0], j=JSON.parse(s.objects[key]);j.status="redeploying";s.objects[key]=JSON.stringify(j);});
    assert.equal(invoke("redeploy",stableEnv).status,0);
    await update(s=>{const key=Object.keys(s.objects)[0], j=JSON.parse(s.objects[key]);j.status="redeploy_failed";j.expiresAt=0;s.objects[key]=JSON.stringify(j);});
    assert.equal(invoke("cleanup",stableEnv).status,0);
    assert.equal(journalOf(await read()).status,"idle");
  });
});

test("redeploy refuses missing, idle, provisioning, destroying and expired runs without deployment", async () => {
  await fixture(async ({invoke,read,update}) => {
    assert.equal(invoke("redeploy",stableEnv).status,1);
    assert.equal(invoke("up",stableEnv).status,0);
    for(const status of ["idle","provisioning","destroying","ready"]) {
      await update(s=>{s.calls=[];const key=Object.keys(s.objects)[0],j=JSON.parse(s.objects[key]);j.status=status;if(status==="ready")j.expiresAt=0;s.objects[key]=JSON.stringify(j);});
      assert.equal(invoke("redeploy",stableEnv).status,1);
      assert.ok(!(await read()).calls.some(c=>c[0]==="fly" || c[0]==="DELETE"));
    }
  });
});

test("redeploy enforces cleanup opt-in, staging controls and existing resources", async () => {
  await fixture(async ({invoke,read,update,source}) => {
    assert.equal(invoke("up",stableEnv).status,0);
    await update(s=>s.calls=[]);
    assert.equal(invoke("redeploy",{...stableEnv,STAGING_STABLE_ENABLED:"false"}).status,1);
    const file=path.join(source,"server/middleware/auth.ts"),original=await readFile(file,"utf8");
    await writeFile(file,"// stale branch controls");
    assert.equal(invoke("redeploy",stableEnv).status,1);
    await writeFile(file,original);
    await update(s=>delete s.apps["ct-stg-clocktracker-db"]);
    assert.equal(invoke("redeploy",stableEnv).status,1);
    assert.ok(!(await read()).calls.some(c=>c[0]==="fly" || c[0]==="DELETE"));
  });
});

test("redeploy does not report success or discard the database when HTTPS readiness fails", async () => {
  await fixture(async ({invoke,read,update}) => {
    assert.equal(invoke("up",stableEnv).status,0);
    const before=await read();
    await update(s=>{s.fail="readiness";s.calls=[];});
    const result=invoke("redeploy",{...stableEnv,STAGING_REF:"feature/new"});
    assert.equal(result.status,1);assert.match(result.stderr,/readiness check failed/);
    const after=await read();
    assert.equal(journalOf(after).status,"redeploy_failed");
    assert.equal(journalOf(after).ref,"main");
    assert.equal(journalOf(after).expiresAt,journalOf(before).expiresAt);
    assert.deepEqual(after.apps["ct-stg-clocktracker-db"],before.apps["ct-stg-clocktracker-db"]);
    assert.ok(!after.calls.some(c=>c[0]==="DELETE"));
  });
});
