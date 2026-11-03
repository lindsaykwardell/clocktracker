import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createApp, defineEventHandler, toNodeListener } from "h3";
import { createClient } from "redis";
import { defineProtectedHandler } from "../../server/utils/protectedHandler";
import { rateLimitScript } from "../../server/utils/rateLimitCore";

test("HTTP handler rejects excess requests before querying, ignores forged auth headers, and permits verified users", async () => {
  delete process.env.RATE_LIMIT_REDIS_URL;
  process.env.FLY_APP_NAME = "test";
  let calls = 0;
  let verifiedUser: string | null = null;
  const app = createApp();
  app.use(defineEventHandler(event => {
    if (verifiedUser) event.context.user = { id: verifiedUser };
  }));
  app.use("/api/search", defineProtectedHandler("search", async () => ({ calls: ++calls })));
  const server = createServer(toNodeListener(app));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const request = (ip: string, extra = {}) => fetch(`http://127.0.0.1:${port}/api/search`, {
    headers: { "fly-client-ip": ip, ...extra },
  });
  try {
    assert.equal((await request("192.0.2.10")).status, 200);
    assert.equal((await request("192.0.2.10")).status, 200);
    const denied = await request("192.0.2.10", { cookie: "sb-fake=admin", authorization: "Bearer forged", "x-forwarded-for": "192.0.2.20" });
    assert.equal(denied.status, 429);
    assert.ok(Number(denied.headers.get("retry-after")) > 0);
    assert.equal(denied.headers.get("cache-control"), "private, no-store");
    assert.equal(calls, 2);
    assert.equal((await request("192.0.2.11")).status, 200);
    verifiedUser = randomUUID();
    for (let i = 0; i < 3; i++) assert.equal((await request("192.0.2.10")).status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    delete process.env.FLY_APP_NAME;
  }
});

test("Redis atomically shares a quota across independent clients and retains expiry on rejected calls", { skip: !process.env.TEST_REDIS_URL }, async () => {
  const a = createClient({ url: process.env.TEST_REDIS_URL });
  const b = createClient({ url: process.env.TEST_REDIS_URL });
  const key = `rate-limit-test:${randomUUID()}`;
  await Promise.all([a.connect(), b.connect()]);
  try {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) =>
      (i % 2 ? a : b).eval(rateLimitScript, { keys: [key], arguments: ["2"] }) as Promise<number[]>,
    ));
    assert.equal(results.filter(result => result[0] === 1).length, 2);
    assert.equal(await a.get(key), "2");
    const before = await a.pTTL(key);
    const denied = await b.eval(rateLimitScript, { keys: [key], arguments: ["2"] }) as number[];
    assert.equal(denied[0], 0);
    assert.ok(denied[1] > 0 && denied[1] <= before);
    await a.pExpire(key, 1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const reset = await b.eval(rateLimitScript, { keys: [key], arguments: ["2"] }) as number[];
    assert.equal(reset[0], 1);
  } finally {
    await a.del(key);
    await Promise.all([a.quit(), b.quit()]);
  }
});
