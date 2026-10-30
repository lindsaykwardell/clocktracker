import { test } from "node:test";
import assert from "node:assert/strict";
import { lifetime, names, extendedExpiry, validateAuth } from "./policy.mjs";

test("lifetime bounds and resource names reject ambiguous or destructive input", () => {
  assert.equal(lifetime("1"), 1);
  assert.equal(lifetime("168"), 168);
  for (const value of ["", "0", "169", "1.5", "abc", "Infinity"]) assert.throws(() => lifetime(value));
  assert.deepEqual(names("0123456789abcdef", "staging.example.com"), {
    app: "ct-stg-0123456789abcdef", db: "ct-stg-0123456789abcdef-db", hostname: "0123456789abcdef.staging.example.com",
  });
  for (const id of ["clocktracker", "../production", "", "ABCDEF0123456789"]) assert.throws(() => names(id, "staging.example.com"));
});
test("extensions cannot revive expired environments or exceed seven days", () => {
  const now = 10_000;
  const state = { status: "ready", readyAt: now, expiresAt: now + 3600000 };
  assert.equal(extendedExpiry(state, 2, now), now + 7200000);
  assert.throws(() => extendedExpiry(state, 1, now));
  assert.throws(() => extendedExpiry(state, 168, now + 1));
  assert.throws(() => extendedExpiry(state, 2, state.expiresAt));
  assert.throws(() => extendedExpiry({ ...state, status: "provisioning" }, 2, now));
});

test("auth configuration rejects privileged keys and non-HTTPS origins", () => {
  validateAuth("https://example.supabase.co", "sb_publishable_test");
  const jwt = role => `header.${Buffer.from(JSON.stringify({role})).toString("base64url")}.signature`;
  validateAuth("https://example.supabase.co", jwt("anon"));
  for (const key of [jwt("service_role"), "sb_secret_test", "invalid"]) assert.throws(() => validateAuth("https://example.supabase.co", key));
  assert.throws(() => validateAuth("http://example.supabase.co", "sb_publishable_test"));
});
