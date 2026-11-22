import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkGrimoire,
  duplicatePlayer,
  nameChanged,
  seatsShifted,
  type GrimoireCheckToken,
} from "../../utils/grimoireChecks";

function seat(
  order: number,
  name: string,
  role_id = `role${order}`,
  extra: Partial<GrimoireCheckToken> = {}
): GrimoireCheckToken {
  return { order, player_name: name, player_id: null, role_id, alignment: "GOOD", ...extra };
}

const page = (...tokens: GrimoireCheckToken[]) => ({ tokens });

test("a clean game has no findings", () => {
  const game = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Bob"), seat(2, "Cid")),
      page(seat(0, "Ann"), seat(1, "Bob"), seat(2, "Cid")),
    ],
  };
  assert.deepEqual(checkGrimoire(game), []);
});

test("seats that rotate between pages are flagged", () => {
  const game = {
    grimoire: [
      page(seat(0, "Ann", "a"), seat(1, "Bob", "b"), seat(2, "Cid", "c")),
      page(seat(0, "Cid", "c"), seat(1, "Ann", "a"), seat(2, "Bob", "b")),
    ],
  };
  const findings = seatsShifted.check(game);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].page, 2);
  assert.match(findings[0].message, /3 moved/);
  assert.match(findings[0].message, /"Ann" seat 1 → 2/);
});

test("a Matron in the game, or a seat added, is not a shift", () => {
  const withMatron = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Bob", "matron")),
      page(seat(0, "Bob", "matron"), seat(1, "Ann")),
    ],
  };
  assert.deepEqual(seatsShifted.check(withMatron), []);

  const travellerJoined = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Bob")),
      page(seat(0, "Ann"), seat(1, "Tia", "traveller"), seat(2, "Bob")),
    ],
  };
  assert.deepEqual(seatsShifted.check(travellerJoined), []);
});

test("Musical Chairs games may move seats, but other checks still run", () => {
  const game = {
    script: "Musical Chairs v2",
    grimoire: [
      page(seat(0, "Ann", "a"), seat(1, "Bob", "b"), seat(2, "Cid", "c")),
      page(seat(0, "Bob", "b"), seat(1, "Ann", "a"), seat(2, "Cid", "c")),
    ],
  };
  assert.deepEqual(seatsShifted.check(game), []);

  const duplicate = { ...game, grimoire: [page(seat(0, "Ann"), seat(1, "Ann"))] };
  assert.equal(duplicatePlayer.check(duplicate).length, 1);
});

test("a gap in the stored seat numbers is not a shift", () => {
  // Drawn the same: the grimoire places tokens by their sorted position.
  const game = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Bob"), seat(2, "Cid")),
      page(seat(0, "Ann"), seat(2, "Bob"), seat(3, "Cid")),
      page(seat(1, "Ann"), seat(1, "Bob"), seat(2, "Cid")),
    ],
  };
  assert.deepEqual(checkGrimoire(game), []);
});

test("a name on two seats is not also reported as a seat shift", () => {
  const game = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Ann"), seat(2, "Bob")),
      page(seat(0, "Ann"), seat(1, "Ann"), seat(2, "Bob")),
    ],
  };
  assert.deepEqual(seatsShifted.check(game), []);
});

test("a seat that keeps its character but changes name says how", () => {
  const linked = { player_id: "u1", player: { username: "bob", display_name: "Bobby" } };
  const game = {
    grimoire: [
      page(seat(0, "Ann", "a"), seat(1, "bob", "b"), seat(2, "Cid", "c"), seat(3, "Dee", "d")),
      page(seat(0, "", "a"), seat(1, "bob", "b", linked), seat(2, "Cyd", "c"), seat(3, "Dee", "d")),
      page(seat(0, "", "a"), seat(1, "bob", "b"), seat(2, "Cyd", "c"), seat(3, "Dee", "d")),
    ],
  };
  const messages = nameChanged.check(game).map((finding) => finding.message);
  assert.equal(messages.length, 4);
  assert.match(messages[0], /seat 1 "Ann" → \(no name\), name removed/);
  assert.match(messages[1], /seat 2 "bob" → "bob" \(linked\), linked from this page on/);
  assert.match(messages[2], /seat 3 "Cid" → "Cyd", different name/);
  assert.match(messages[3], /Page 2 → 3: seat 2 "bob" \(linked\) → "bob", unlinked/);
});

test("a name change together with a character change is left to the other rules", () => {
  const game = {
    grimoire: [page(seat(0, "Ann", "a")), page(seat(0, "Bob", "b"))],
  };
  assert.deepEqual(nameChanged.check(game), []);
});

test("the same player on two seats of a page is flagged", () => {
  const game = {
    grimoire: [page(seat(0, "Ann"), seat(1, "@ann"), seat(2, "Bob"))],
  };
  const findings = duplicatePlayer.check(game);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /Page 1: "Ann" on seats 1, 2/);
});

test("a duplicate that repeats on every page is reported once", () => {
  const game = {
    grimoire: [
      page(seat(0, "Ann"), seat(1, "Ann")),
      page(seat(0, "Ann"), seat(1, "Ann")),
    ],
  };
  const findings = duplicatePlayer.check(game);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /Pages 1, 2: "Ann" on seats 1, 2/);
});
