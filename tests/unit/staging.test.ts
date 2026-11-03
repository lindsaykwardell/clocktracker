import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp, defineEventHandler, toNodeListener } from "h3";
import { enforceStagingAccess } from "../../server/utils/stagingAccess";

async function server(options: { enabled?: boolean; expiresAt?: string; admin?: boolean; fail?: boolean }, run: (request: (path: string, user?: string, method?: string) => Promise<Response>) => Promise<void>) {
  const app = createApp();
  app.use(defineEventHandler(async event => {
    // Test-only identity injection, not an authentication mechanism.
    const id = event.node.req.headers["x-test-user"];
    if (typeof id === "string") event.context.user = { id };
    const response = await enforceStagingAccess(event, {
      enabled: options.enabled ?? true,
      expiresAt: options.expiresAt ?? new Date(Date.now() + 60_000).toISOString(),
      isAdmin: async () => { if (options.fail) throw new Error("Database unavailable"); return options.admin ?? false; },
    });
    return response ?? { data: "protected" };
  }));
  const http = createServer(toNodeListener(app));
  await new Promise<void>(resolve => http.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(http.address() as { port: number }).port}`;
  try { await run((path, user, method = "GET") => fetch(base + path, { method, redirect: "manual", headers: user ? { "x-test-user": user } : {} })); }
  finally { http.closeAllConnections(); await new Promise<void>(resolve => http.close(() => resolve())); }
}

test("signed-out staging exposes only home, login, and static assets; APIs fail closed", async () => {
  await server({}, async request => {
    for (const path of ["/", "/login", "/login/", "/_nuxt/app.js", "/img/role/test.png"]) assert.equal((await request(path)).status, 200, path);
    for (const path of ["/user/test", "/community/test", "/reset-password", "/game/test"]) {
      const response = await request(path);
      assert.equal(response.status, 302, path);
      assert.equal(response.headers.get("location"), "/login");
    }
    for (const path of ["/api/games", "/api/settings", "/api/staging-access", "/api/export.json", "/api/forum/announcement"]) {
      const response = await request(path);
      assert.equal(response.status, 401, path);
      assert.match(response.headers.get("cache-control")!, /no-store/);
    }
    assert.equal((await request("/", undefined, "POST")).status, 401);
  });
});
test("non-admins cannot read or mutate staging, even with authenticated IDs", async () => {
  await server({}, async request => {
    for (const method of ["GET", "POST", "PUT", "DELETE"]) assert.equal((await request("/api/games", "member", method)).status, 403);
    assert.equal((await request("/game/test", "member")).status, 403);
  });
});
test("admins can use staging but external side effects stay disabled", async () => {
  await server({ admin: true }, async request => {
    assert.equal((await request("/api/games", "admin", "POST")).status, 200);
    assert.equal((await request("/api/staging-access", "admin")).status, 200);
    for (const path of ["/api/storage/avatars", "/api/games/123/post_to_bgg", "/api/auth/email-allowance", "/settings/password", "/settings/integrations", "/api/forum/threads/1/github-issue"]) assert.equal((await request(path, "admin")).status, 403, path);
  });
});
test("expired and invalid deadlines fail closed, including public pages", async () => {
  for (const expiresAt of ["invalid", new Date(0).toISOString()]) await server({ admin: true, expiresAt }, async request => {
    assert.equal((await request("/login")).status, 410);
    assert.equal((await request("/api/games", "admin")).status, 410);
  });
});
test("database outage does not grant staging access; production behavior is unchanged", async () => {
  await server({ fail: true }, async request => assert.equal((await request("/api/games", "admin")).status, 500));
  await server({ enabled: false }, async request => assert.equal((await request("/api/games")).status, 200));
});
