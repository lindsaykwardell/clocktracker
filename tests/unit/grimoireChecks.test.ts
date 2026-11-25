import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkGrimoire,
  duplicatePlayer,
  nameChanged,
  seatsShifted,
  unfilledChanges,
  unfilledDeaths,
  unfilledOther,
  type GrimoireCheckEvent,
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

test("Musical Chairs games may move seats and names, but other checks still run", () => {
  const game = {
    script: "Musical Chairs v2",
    grimoire: [
      page(seat(0, "Ann", "a"), seat(1, "Bob", "b"), seat(2, "Cid", "c")),
      page(seat(0, "Bob", "b"), seat(1, "Ann", "a"), seat(2, "Cid", "c")),
    ],
  };
  assert.deepEqual(seatsShifted.check(game), []);

  // A player leaving a seat whose character stays is not a name change there.
  const leftSeat = {
    ...game,
    grimoire: [
      page(seat(0, "Ann", "a"), seat(1, "", "b")),
      page(seat(0, "", "a"), seat(1, "Ann", "b")),
    ],
  };
  assert.deepEqual(nameChanged.check(leftSeat), []);

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
  // Not a shift; the broken numbers themselves are their own finding.
  assert.deepEqual(
    checkGrimoire(game).filter((finding) => finding.rule !== "broken-seat-numbers"),
    []
  );
  assert.deepEqual(
    checkGrimoire(game).map((finding) => finding.message),
    ["Page 2: no seat 2", "Page 3: seat 2 twice, no seat 1"]
  );
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

function event(event_type: string, extra: Partial<GrimoireCheckEvent> = {}): GrimoireCheckEvent {
  return {
    grimoire_page: 1,
    participant_id: "p1",
    event_type,
    cause: null,
    by_participant_id: null,
    by_role_id: null,
    player_name: "Ann",
    role_id: "a",
    old_role_id: null,
    new_role_id: null,
    old_alignment: null,
    new_alignment: null,
    ...extra,
  };
}

test("only events without a cause are listed, one line each", () => {
  const game = {
    grimoire: [],
    grimoire_events: [
      event("NOT_RECORDED"),
      event("DEATH", { cause: "ABILITY", by_role_id: "imp" }),
      event("EXECUTION", { cause: "NOMINATION" }),
      event("ROLE_CHANGE", { old_role_id: "a", new_role_id: "b" }),
      event("ROLE_CHANGE", { by_role_id: "barber" }),
      event("POISONED", { by_role_id: "poisoner" }),
      event("REVIVE"),
    ],
  };
  assert.deepEqual(unfilledDeaths.check(game).map((finding) => finding.message), ['Page 2: "Ann" died']);
  assert.deepEqual(unfilledChanges.check(game).map((finding) => finding.message), ['Page 2: "Ann" a → b']);
  assert.deepEqual(unfilledOther.check(game).map((finding) => finding.message), ['Page 2: "Ann" revived']);
});

test("an unfilled change says who and what, on the page where it shows", () => {
  const ann = { grimoire_participant_id: "p1", role: { name: "Barber" } };
  const game = {
    grimoire: [
      page(seat(0, "Ann", "barber", ann)),
      page(seat(0, "Ann", "snake_charmer", { ...ann, role: { name: "Snake Charmer" } })),
    ],
    grimoire_events: [
      event("ROLE_CHANGE", { old_role_id: "barber", new_role_id: "snake_charmer" }),
      event("ALIGNMENT_CHANGE", { old_alignment: "GOOD", new_alignment: "EVIL" }),
    ],
  };
  assert.deepEqual(
    unfilledChanges.check(game).map((finding) => finding.message),
    ['Page 2: "Ann" Barber → Snake Charmer', 'Page 2: "Ann" (Snake Charmer) Good → Evil']
  );
  assert.equal(unfilledDeaths.check(game).length, 0);
  assert.equal(unfilledOther.check(game).length, 0);
});

test("players changing seats in Musical Chairs have no cause to fill in", () => {
  const seatChange = {
    grimoire: [],
    grimoire_events: [
      event("SEAT_CHANGE"),
      event("ROLE_CHANGE", { old_role_id: "a", new_role_id: "b" }),
      event("ROLE_CHANGE", { participant_id: "p2", old_role_id: "c", new_role_id: "d" }),
    ],
  };
  assert.equal(unfilledChanges.check(seatChange).length, 3);
  // The move explains Ann's new character; p2's change still needs a cause.
  const musical = unfilledChanges.check({ ...seatChange, script: "Musical Chairs" });
  assert.equal(musical.length, 1);
  assert.equal(musical[0].message, 'Page 2: "Ann" c → d');
});

test("deaths are off at first; the grimoire checks don't look at events", () => {
  assert.equal(unfilledDeaths.offByDefault, true);
  assert.deepEqual(checkGrimoire({ grimoire: [], grimoire_events: [event("NOT_RECORDED")] }), []);
});

test("an exile is a complete death, like an execution", () => {
  const game = { grimoire: [], grimoire_events: [event("EXILE"), event("EXECUTION"), event("NOT_RECORDED")] };
  assert.deepEqual(unfilledDeaths.check(game).map((finding) => finding.message), ['Page 2: "Ann" died']);
});
