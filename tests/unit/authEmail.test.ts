import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createApp, toNodeListener } from "h3";
import { createClient } from "redis";
import { authEmailLimitScript, emailIdentity } from "../../server/utils/authEmail";
import handler from "../../server/api/auth/email-allowance.post";

test("email identity normalizes case and whitespace without merging distinct aliases", () => {
  assert.equal(emailIdentity(" Person@Example.COM "), emailIdentity("person@example.com"));
  assert.notEqual(emailIdentity("person+tag@example.com"), emailIdentity("person@example.com"));
});

test("Redis atomically enforces shared cooldown, rolling daily cap, and expiry", { skip: !process.env.TEST_REDIS_URL }, async () => {
  const clients = [createClient({ url: process.env.TEST_REDIS_URL }), createClient({ url: process.env.TEST_REDIS_URL })];
  await Promise.all(clients.map(c => c.connect()));
  const key = `auth-email-test:${randomUUID()}`;
  const a = clients[0];
  const consume = (id: string, i = 0) => clients[i].eval(authEmailLimitScript, { keys: [key], arguments: [id] }) as Promise<number[]>;
  try {
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, i) => consume(`delivery-${i}`, i % 2)));
    assert.equal(attempts.filter(r => r[0] === 1).length, 1);
    const winner = attempts.findIndex(r => r[0] === 1);
    assert.equal((await consume(`delivery-${winner}`, 1))[0], 0);
    assert.equal(await a.zCard(key), 1);
    const ttl = await a.pTTL(key);
    assert.equal((await consume("blocked"))[0], 0);
    assert.ok(await a.pTTL(key) <= ttl);
    await a.del(key);
    const now = Date.now();
    await a.zAdd(key, Array.from({ length: 5 }, (_, i) => ({ score: now - (i + 1) * 600000, value: `prior-${i}` })));
    const denied = await consume("sixth");
    assert.equal(denied[0], 0);
    assert.ok(denied[1] > 80000000);
    await a.zAdd(key, { score: now - 86400001, value: "prior-4" });
    assert.equal((await consume("after-expiry"))[0], 1);
    assert.equal(await a.zCard(key), 5);
  } finally {
    await a.del(key);
    await Promise.all(clients.map(c => c.quit()));
  }
});

test("email allowance validates input, shares case-insensitive quotas, and fails closed", { skip: !process.env.TEST_REDIS_URL }, async () => {
  process.env.RATE_LIMIT_REDIS_URL = process.env.TEST_REDIS_URL;
  const email = `${randomUUID()}@example.com`;
  const redis = createClient({ url: process.env.TEST_REDIS_URL });
  await redis.connect();
  const server = createServer(toNodeListener(createApp().use("/api/auth/email-allowance", handler)));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/auth/email-allowance`;
  const request = (address: string) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: address }) });
  try {
    assert.equal((await request("invalid")).status, 400);
    assert.equal((await request(email)).status, 200);
    const denied = await request(` ${email.toUpperCase()} `);
    assert.equal(denied.status, 429);
    assert.ok(Number(denied.headers.get("retry-after")) > 0);
    assert.equal(denied.headers.get("cache-control"), "no-store");
    assert.equal((await denied.json()).data.retryAfter, 300);
    delete process.env.RATE_LIMIT_REDIS_URL;
    assert.equal((await request(email)).status, 503);
  } finally {
    await redis.del(`auth-email:v1:${emailIdentity(email)}`);
    await redis.quit();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
