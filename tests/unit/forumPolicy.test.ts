import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizedForumText, screeningReason, editScreeningReason, accountYoungerThan } from "../../server/utils/forumPolicy";

test("duplicate normalization catches casing, whitespace, and Unicode compatibility variants", () => {
  assert.equal(normalizedForumText("  HELLO\n world  "), normalizedForumText("hello world"));
  assert.equal(normalizedForumText("ｓｐａｍ"), normalizedForumText("spam"));
});

test("new contributors are held and link limits do not misclassify game terminology", () => {
  assert.match(screeningReason("The demon killed the poisoned player.", true)!, /24 hours/);
  assert.equal(screeningReason("The demon killed the poisoned player.", false), null);
  assert.match(screeningReason("https://one.test https://two.test", true)!, /24 hours/);
  assert.match(screeningReason(Array(6).fill("https://example.test").join(" "), false)!, /Link limit/);
  assert.equal(screeningReason("https://example.test", false), null);
});

 test("posting gates use the exact 24-hour boundary and editing uses seven days", () => {
  const now = Date.UTC(2026, 9, 30);
  assert.equal(accountYoungerThan(new Date(now - 86400000 + 1), 1, now), true);
  assert.equal(accountYoungerThan(new Date(now - 86400000), 1, now), false);
  assert.equal(accountYoungerThan(new Date(now - 7 * 86400000), 7, now), false);
  assert.equal(accountYoungerThan(null, 1, now), true);
});

test("only new or changed external links gate young-account edits", () => {
  assert.equal(editScreeningReason("Typo fixed", "Typo", true), null);
  assert.equal(editScreeningReason("Fixed https://example.test/a", "https://example.test/a", true), null);
  assert.equal(editScreeningReason("Link removed", "https://example.test/a", true), null);
  assert.match(editScreeningReason("https://example.test/b", "https://example.test/a", true)!, /seven days/);
  assert.match(editScreeningReason("www.example.test", "No links", true)!, /seven days/);
  assert.equal(editScreeningReason("https://example.test/b", "https://example.test/a", false), null);
  assert.match(editScreeningReason(Array(6).fill("https://example.test").join(" "), "", false)!, /Link limit/);
});
