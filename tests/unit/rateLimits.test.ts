import { test } from "node:test";
import assert from "node:assert/strict";
import { anonymousIdentity, LocalRequestLimits, RequestSlots } from "../../server/utils/rateLimitCore";
import { protectedCategory, requestLimits } from "../../shared/protectedRequests";

test("anonymous IPv4 and mapped IPv6 share an identity; IPv6 rotations within /64 share a budget", () => {
  assert.equal(anonymousIdentity("192.0.2.1"), anonymousIdentity("::ffff:192.0.2.1"));
  assert.equal(anonymousIdentity("2001:db8::1"), anonymousIdentity("2001:db8::ff"));
  assert.notEqual(anonymousIdentity("2001:db8::1"), anonymousIdentity("2001:db8:0:1::1"));
  assert.equal(anonymousIdentity("forged, forwarded"), "unknown");
});

test("local fallback enforces separate category and identity budgets and expires without extending on denial", () => {
  const limits = new LocalRequestLimits();
  assert.equal(limits.consume("search:ip1", 2, 0).allowed, true);
  assert.equal(limits.consume("search:ip1", 2, 1000).allowed, true);
  assert.deepEqual(limits.consume("search:ip1", 2, 2000), { allowed: false, retryAfter: 58 });
  assert.equal(limits.consume("search:ip2", 2, 2000).allowed, true);
  assert.equal(limits.consume("stats:ip1", 5, 2000).allowed, true);
  assert.equal(limits.consume("search:ip1", 2, 60_000).allowed, true);
});

test("fallback refuses new identities when full instead of evicting active limits", () => {
  const limits = new LocalRequestLimits(1);
  assert.equal(limits.consume("a", 1, 0).allowed, true);
  assert.equal(limits.consume("b", 1, 1).allowed, false);
  assert.equal(limits.consume("a", 1, 2).allowed, false);
  assert.equal(limits.consume("b", 1, 60_001).allowed, true);
});

test("concurrency reserves capacity for authenticated users and releases exactly once", () => {
  const slots = new RequestSlots();
  const a = slots.acquire(false)!;
  const b = slots.acquire(false)!;
  assert.equal(slots.acquire(false), null);
  const c = slots.acquire(true)!;
  const d = slots.acquire(true)!;
  assert.equal(slots.acquire(true), null);
  a(); a();
  assert.ok(slots.acquire(false));
  assert.equal(slots.acquire(true), null);
  b(); c(); d();
});

test("only expensive read endpoints belong to protected categories", () => {
  assert.equal(protectedCategory("/api/search?query=test"), "search");
  for (const path of ["/api/user/alice/games", "/api/games/community/example", "/api/script/1/stats", "/api/roles/demon/stats", "/api/community/example/stats/"]) {
    assert.equal(protectedCategory(path), "games-stats");
  }
  for (const path of ["/api/games/123", "/api/settings", "/api/games", "/api/landing-stats", "/login"]) {
    assert.equal(protectedCategory(path), null);
  }
  assert.deepEqual(requestLimits.anonymous, { search: 2, "games-stats": 5 });
  assert.deepEqual(requestLimits.authenticated, { search: 60, "games-stats": 120 });
});
