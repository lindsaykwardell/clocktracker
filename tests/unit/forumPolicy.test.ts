import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizedForumText, screeningReason } from "../../server/utils/forumPolicy";

test("duplicate normalization catches casing, whitespace, and Unicode compatibility variants", () => {
  assert.equal(normalizedForumText("  HELLO\n world  "), normalizedForumText("hello world"));
  assert.equal(normalizedForumText("ｓｐａｍ"), normalizedForumText("spam"));
});

test("new contributors are held and link limits do not misclassify game terminology", () => {
  assert.match(screeningReason("The demon killed the poisoned player.", true)!, /First contributions/);
  assert.equal(screeningReason("The demon killed the poisoned player.", false), null);
  assert.match(screeningReason("https://one.test https://two.test", true)!, /Link limit/);
  assert.match(screeningReason(Array(6).fill("https://example.test").join(" "), false)!, /Link limit/);
  assert.equal(screeningReason("https://example.test", false), null);
});
