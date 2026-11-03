import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import { sharedLimit } from "../../server/utils/sharedRequestLimit";
import { createServer } from "node:http";
import * as h3 from "h3";
import { createForumRequestGuard } from "../../server/utils/forumRequestGuard";
import { LocalRequestLimits } from "../../server/utils/rateLimitCore";

async function serve(app: ReturnType<typeof h3.createApp>, run: (base: string) => Promise<void>) {
  const server = createServer(h3.toNodeListener(app));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as { port: number }).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

test("forum API gate ignores preview flags, guards edits and replies, and fails closed without a limiter", async () => {
  let enabled = false;
  let available = true;
  let user: string | null = "member";
  let writes = 0;
  const limits = new LocalRequestLimits();
  const app = h3.createApp();
  app.use(h3.defineEventHandler(event => { if (user) event.context.user = { id: user }; }));
  app.use(createForumRequestGuard({ enabled: async () => enabled, consume: async (key, limit) => available ? limits.consume(key, limit) : null }));
  app.use(h3.defineEventHandler(() => ({ writes: ++writes })));
  await serve(app, async base => {
    const request = (path: string, method = "GET") => fetch(base + path, { method });
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      assert.equal((await request("/api/forum/posts/p?featureFlags=forum", method)).status, 404);
    }
    assert.equal(writes, 0);
    assert.equal((await request("/api/settings")).status, 200);
    enabled = true;
    user = null;
    assert.equal((await request("/api/forum/posts/p", "PUT")).status, 401);
    user = "member";
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => request(`/api/forum/posts/p${i}`, "PUT")));
    assert.equal(results.filter(r => r.status === 200).length, 5);
    const denied = results.find(r => r.status === 429)!;
    assert.ok(Number(denied.headers.get("retry-after")) > 0);
    assert.equal(denied.headers.get("cache-control"), "private, no-store");
    // Deletes cannot reset the separate attempt counter; title edits share it.
    assert.equal((await request("/api/forum/posts/p", "DELETE")).status, 200);
    assert.equal((await request("/api/forum/threads/t", "PUT")).status, 429);
    assert.equal((await request("/api/forum/categories/general/threads", "POST")).status, 200);
    assert.equal((await request("/api/forum/categories/other/threads", "POST")).status, 429);
    available = false;
    assert.equal((await request("/api/forum/threads/t/posts", "POST")).status, 503);
    assert.equal((await request("/api/forum/threads/t")).status, 200);
  });
});

test("forum access rejects private and deleted content and enforces bans and locks before edits", async () => {
  Object.assign(globalThis, h3);
  let visible = false;
  let banned = false;
  let deleted = false;
  let postDeleted = false;
  let locked = false;
  let historyReads = 0;
  let writes = 0;
  const category = { id: "private", slug: "private", is_private: true, mod_posting_only: false, is_announcement: true };
  const db = {
    userSettings: { findUnique: async () => ({ is_admin: false }) },
    userGroupMembership: { findMany: async () => [] },
    categoryAccess: { findFirst: async () => visible ? { can_view: true, can_post: true } : null },
    forumUserPreference: { findMany: async () => [], findFirst: async () => null },
    forumBan: { findFirst: async () => banned ? { id: "ban" } : null },
    forumThread: { findFirst: async () => deleted ? null : { id: "t", title: "Private title", author_id: "member", author: {}, posts: [{ id: "p", body: "Private body" }], is_locked: locked, category } },
    forumPost: { findFirst: async () => postDeleted ? null : { id: "p", thread_id: "t", author_id: "member", body: "original" }, update: async () => { writes++; return {}; } },
    forumPostEdit: { findMany: async () => { historyReads++; return []; }, create: async () => { writes++; return {}; } },
  };
  (globalThis as any).prisma = db;
  let forumEnabled = true;
  let notifications = 0;
  const subscription = () => ({
    id: "s", user_id: "member", last_read_at: new Date(0),
    thread: { id: "t", title: "Private title", last_post_at: new Date(), deleted_at: deleted ? new Date() : null, category, author: {}, _count: { posts: 1 } },
  });
  Object.assign(db, {
    forumThreadSubscription: { findMany: async () => [subscription()] },
    forumCategory: { findFirst: async () => ({ ...category, is_announcement: true }) },
    featureFlag: { findMany: async (query: any) => query.where ? (forumEnabled ? [{ id: 1 }] : []) : [{ id: 1, name: "forum", rollout_percentage: null }] },
    koFiPayment: { findFirst: async () => null },
  });
  Object.assign(db.userSettings, { findMany: async () => [{ user_id: "member" }] });
  (globalThis as any).useRuntimeConfig = () => { notifications++; return { public: {} }; };
  const forum = await import("../../server/utils/forum");
  const senders = await import("../../server/utils/sendForumNotifications");
  const subscriptions = (await import("../../server/api/forum/subscriptions/index.get")).default;
  const unread = (await import("../../server/api/forum/subscriptions/unread-count.get")).default;
  const announcement = (await import("../../server/api/forum/announcement.get")).default;
  const history = (await import("../../server/api/forum/posts/[id]/edits.get")).default;
  const edit = (await import("../../server/api/forum/posts/[id]/index.put")).default;
  const app = h3.createApp();
  app.use(h3.defineEventHandler(event => { event.context.user = { id: "member" }; event.context.params = { id: "p" }; }));
  app.use("/subscriptions", subscriptions);
  app.use("/unread", unread);
  app.use("/announcement", announcement);
  app.use("/history", history);
  app.use("/edit", edit);
  await serve(app, async base => {
    assert.equal((await fetch(base + "/history")).status, 404);
    assert.equal(historyReads, 0);
    visible = true;
    assert.equal((await fetch(base + "/history")).status, 200);
    deleted = true;
    assert.equal((await fetch(base + "/history")).status, 404);
    deleted = false;
    postDeleted = true;
    assert.equal((await fetch(base + "/history")).status, 404);
    postDeleted = false;
    const put = () => fetch(base + "/edit", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: "replacement" }) });
    banned = true;
    assert.equal((await put()).status, 403);
    banned = false;
    locked = true;
    assert.equal((await put()).status, 403);
    locked = false;
    visible = false;
    assert.equal((await put()).status, 404);
    assert.equal(writes, 0);
    assert.deepEqual(await forum.filterForumRecipients(["member", "member"], category), []);
    assert.deepEqual(await (await fetch(base + "/subscriptions")).json(), []);
    assert.deepEqual(await (await fetch(base + "/unread")).json(), { count: 0 });
    assert.equal(await (await fetch(base + "/announcement")).text(), "");
    const notify = () => senders.sendForumNotifications({ threadId: "t", posterId: "other", posterDisplayName: "Other", postBody: "private" });
    await notify();
    await senders.sendCategoryNewThreadNotifications({ threadId: "t", postBody: "private", authorDisplayName: "Other", subscriberUserIds: ["member"] });
    await senders.sendAnnouncementNotifications({ threadId: "t", postBody: "private" });
    assert.equal(notifications, 0);
    visible = true;
    assert.equal((await (await fetch(base + "/announcement")).json()).body, "Private body");
    assert.equal((await (await fetch(base + "/subscriptions")).json()).length, 1);
    assert.deepEqual(await (await fetch(base + "/unread")).json(), { count: 1 });
    await notify();
    assert.equal(notifications, 1);
    forumEnabled = false;
    await notify();
    assert.equal(notifications, 1);
    forumEnabled = true;
    deleted = true;
    await notify();
    assert.equal(notifications, 1);
    deleted = false;
    assert.deepEqual(await forum.filterForumRecipients(["member", "member"], category), ["member"]);
  });
});


test("forum shared limiter atomically consumes concurrent attempts across callers", { skip: !process.env.TEST_REDIS_URL }, async () => {
  process.env.RATE_LIMIT_REDIS_URL = process.env.TEST_REDIS_URL;
  const key = `forum-test:${randomUUID()}`;
  const redis = createClient({ url: process.env.TEST_REDIS_URL });
  await redis.connect();
  try {
    const results = await Promise.all(Array.from({ length: 12 }, () => sharedLimit(key, 5)));
    assert.equal(results.filter(r => r?.allowed).length, 5);
    assert.equal(await redis.get(key), "5");
    const before = await redis.pTTL(key);
    assert.equal((await sharedLimit(key, 5))?.allowed, false);
    assert.ok(await redis.pTTL(key) <= before);
  } finally {
    await redis.del(key);
    await redis.quit();
    delete process.env.RATE_LIMIT_REDIS_URL;
  }
});
