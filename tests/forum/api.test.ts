import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "redis";

const authUrl = process.env.SUPABASE_URL!;
const redisUrl = process.env.RATE_LIMIT_REDIS_URL!;
if (!authUrl || !["localhost", "127.0.0.1"].includes(new URL(authUrl).hostname) || !redisUrl || !["localhost", "127.0.0.1"].includes(new URL(redisUrl).hostname)) throw new Error("Forum integration tests require local Supabase and Redis.");

async function session(email: string) {
  const cookies: { name: string; value: string }[] = [];
  const client = createServerClient(authUrl, process.env.SUPABASE_KEY!, { cookieOptions: { name: "sb-clocktracker-auth-token" }, cookies: { getAll: () => cookies, setAll: values => { cookies.push(...values); } } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: "password123" });
  if (error) throw error;
  const cookie = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  return { id: data.user!.id, cookie };
}
const api = (user: { cookie: string } | null, path: string, method = "GET", data?: unknown) => fetch(`http://localhost:3000/api${path}`, {
  method, headers: { ...(user ? { Cookie: user.cookie } : {}), "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(15000),
});
async function json(response: Response, expected = 200) {
  const text = await response.text();
  assert.equal(response.status, expected, text);
  return text ? JSON.parse(text) : null;
}

test("Docker forum workflow: moderation, privacy, limits, reports, and mute/block", { timeout: 90000 }, async t => {
  const [newcomer, member, admin] = await Promise.all([session("forum-new@example.test"), session("forum-member@example.test"), session("dev@clocktracker.app")]);
  const redis = createClient({ url: redisUrl });
  await redis.connect();
  const clear = (id: string) => redis.del(["newcomer", "thread", "post", "edit", "report", "reaction"].map(k => `forum:v1:${k}:${id}`));
  const marker = `Integration ${randomUUID().slice(0, 8)}`;
  try {
    await clear(newcomer.id); await clear(member.id);
    await json(await api(newcomer, "/forum/preferences", "PUT", { targetId: member.id, kind: null }));
    await json(await api(member, "/forum/preferences", "PUT", { targetId: newcomer.id, kind: null }));
    const thread = await json(await api(newcomer, "/forum/categories/forum-testing/threads", "POST", { title: marker, body: `${marker} original` }));
    assert.equal(thread.pending, true);
    const postId = thread.posts[0].id;
    const path = `/forum/threads/${thread.id}`;
    await t.test("held content is invisible in reads, history, search, categories, and the dashboard", async () => {
      await json(await api(null, path), 404);
      await json(await api(null, `/forum/posts/${postId}/edits`), 404);
      for (const endpoint of [`/forum/search?q=${encodeURIComponent(marker)}`, "/forum/categories", "/forum/categories/forum-testing/threads", "/dashboard/recent"]) {
        const result = await json(await api(member, endpoint));
        assert.equal(JSON.stringify(result).includes(marker), false, endpoint);
      }
      await json(await api(newcomer, "/forum/categories/forum-testing/threads", "POST", { title: "Too fast", body: "too fast" }), 429);
    });
    let queued = (await json(await api(admin, "/forum/moderation"))).find((s: any) => s.thread_id === thread.id);
    await t.test("review requires permission, a reason, and a single successful decision", async () => {
      await json(await api(member, `/forum/moderation/${queued.id}/review`, "POST", { action: "approve", reason: "unauthorized" }), 403);
      await json(await api(admin, `/forum/moderation/${queued.id}/review`, "POST", { action: "approve", reason: "" }), 400);
      const results = await Promise.all([1, 2].map(() => api(admin, `/forum/moderation/${queued.id}/review`, "POST", { action: "approve", reason: "Constructive discussion." })));
      assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
      const published = await json(await api(null, path));
      assert.equal(published.posts[0].body, `${marker} original`);
    });
    await t.test("pending edits keep the approved version and rejected edits explain why", async () => {
      await clear(newcomer.id);
      const edit = await json(await api(newcomer, `/forum/posts/${postId}`, "PUT", { body: `${marker} pending edit` }));
      assert.equal(edit.pending, true);
      assert.equal((await json(await api(null, path))).posts[0].body, `${marker} original`);
      assert.equal(JSON.stringify(await json(await api(null, `/forum/posts/${postId}/edits`))).includes("pending edit"), false);
      queued = (await json(await api(admin, "/forum/moderation"))).find((s: any) => s.post_id === postId);
      await json(await api(admin, `/forum/moderation/${queued.id}/review`, "POST", { action: "reject", reason: "Please clarify the example." }));
      const mine = await json(await api(newcomer, "/forum/submissions"));
      assert.ok(mine.some((s: any) => s.id === queued.id && s.status === "REJECTED" && s.review_reason === "Please clarify the example."));
      await clear(newcomer.id);
      await json(await api(newcomer, `/forum/posts/${postId}`, "PUT", { body: `${marker} approved edit` }));
      queued = (await json(await api(admin, "/forum/moderation"))).find((s: any) => s.post_id === postId);
      await json(await api(admin, `/forum/moderation/${queued.id}/review`, "POST", { action: "approve", reason: "Thanks for clarifying." }));
      assert.equal((await json(await api(null, path))).posts[0].body, `${marker} approved edit`);
    });
    let reply: any;
    await t.test("established members publish, duplicates are rejected, and link-heavy posts are held", async () => {
      await clear(member.id);
      reply = await json(await api(member, `${path}/posts`, "POST", { body: `${marker} established reply` }));
      assert.equal(reply.pending, false);
      await clear(member.id);
      await json(await api(member, `${path}/posts`, "POST", { body: `${marker.toUpperCase()}   ESTABLISHED REPLY` }), 409);
      await clear(member.id);
      const held = await json(await api(member, `${path}/posts`, "POST", { body: `${marker} ${Array(6).fill("https://example.test").join(" ")}` }));
      assert.equal(held.pending, true);
      assert.equal((await json(await api(null, path))).posts.some((p: any) => p.id === held.id), false);
      queued = (await json(await api(admin, "/forum/moderation"))).find((s: any) => s.post_id === held.id);
      await json(await api(admin, `/forum/moderation/${queued.id}/review`, "POST", { action: "reject", reason: "Reduce repeated links." }));
    });
    await t.test("reports increment the moderator alert and regular members cannot read the queue", async () => {
      const before = await json(await api(admin, "/forum/moderation/summary"));
      await json(await api(member, `/forum/posts/${postId}/report`, "POST", { reason: "Local report test" }));
      const after = await json(await api(admin, "/forum/moderation/summary"));
      assert.equal(after.reports, before.reports + 1);
      await json(await api(member, "/forum/moderation"), 403);
    });
    await t.test("mute is one-way; block hides both directions and prevents replies and reactions", async () => {
      await json(await api(newcomer, "/forum/preferences", "PUT", { targetId: member.id, kind: "MUTE" }));
      assert.equal((await json(await api(newcomer, path))).posts.some((p: any) => p.id === reply.id), false);
      assert.equal((await api(member, path)).status, 200);
      await json(await api(newcomer, "/forum/preferences", "PUT", { targetId: member.id, kind: "BLOCK" }));
      await clear(member.id);
      await json(await api(member, `${path}/posts`, "POST", { body: "Blocked reply" }), 404);
      await json(await api(member, `/forum/posts/${postId}/reactions`, "POST", { emoji: "👍" }), 404);
      await json(await api(newcomer, "/forum/preferences", "PUT", { targetId: member.id, kind: null }));
      assert.equal((await api(member, path)).status, 200);
      assert.equal((await json(await api(newcomer, path))).posts.some((p: any) => p.id === reply.id), true);
    });
  } finally {
    await api(newcomer, "/forum/preferences", "PUT", { targetId: member.id, kind: null });
    await redis.quit();
  }
});
