import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRoleStatCardPreview } from "../../composables/useRoleStatCards";

// The General cards about what happened to a player (poisoned, drunk, ...)
// and Travellers joining late or leaving early.

const ROLES: Record<string, { name: string; type: string; initial_alignment: string }> = {
  chef: { name: "Chef", type: "TOWNSFOLK", initial_alignment: "GOOD" },
  monk: { name: "Monk", type: "TOWNSFOLK", initial_alignment: "GOOD" },
  drunk: { name: "Drunk", type: "OUTSIDER", initial_alignment: "GOOD" },
  poisoner: { name: "Poisoner", type: "MINION", initial_alignment: "EVIL" },
  sailor: { name: "Sailor", type: "TOWNSFOLK", initial_alignment: "GOOD" },
  imp: { name: "Imp", type: "DEMON", initial_alignment: "EVIL" },
  beggar: { name: "Beggar", type: "TRAVELER", initial_alignment: "NEUTRAL" },
};

type Seat = { id: string; username?: string; roleId?: string };

/** A seat: a player with a character, or an empty one ({ id } only). */
function page(seats: Seat[]) {
  return {
    tokens: seats.map((seat, order) => ({
      order,
      grimoire_participant_id: seat.id,
      role_id: seat.roleId ?? null,
      role: seat.roleId ? { id: seat.roleId, token_url: `/${seat.roleId}.webp`, ...ROLES[seat.roleId] } : undefined,
      alignment: seat.roleId ? "GOOD" : "NEUTRAL",
      is_dead: false,
      player_name: seat.username ?? "",
      player_id: seat.username ? `id-${seat.username}` : null,
      player: seat.username ? { username: seat.username } : undefined,
    })),
  };
}

let nextEventId = 1;
function event(type: string, page: number, participantId: string, byRoleId: string | null = null, byParticipantId: string | null = null) {
  return {
    id: nextEventId++,
    grimoire_page: page,
    participant_id: participantId,
    event_type: type,
    status_source: null,
    cause: null,
    by_participant_id: byParticipantId,
    by_role_id: byRoleId,
    player_name: participantId,
  };
}

let nextGameId = 1;
function game(pages: ReturnType<typeof page>[], events: ReturnType<typeof event>[] = []) {
  return {
    id: `game-${nextGameId++}`,
    ignore_for_stats: false,
    end_trigger: "NOT_RECORDED",
    grimoire: pages,
    grimoire_events: events,
  };
}

function preview(cardId: string, games: ReturnType<typeof game>[], username = "ann") {
  const card = buildRoleStatCardPreview(cardId, games as any, true, null, username);
  assert.ok(card, `no card ${cardId}`);
  return card.preview;
}

const ann = (roleId?: string): Seat => ({ id: "ann", username: roleId ? "ann" : undefined, roleId });
const others: Seat[] = [
  { id: "bob", username: "bob", roleId: "poisoner" },
  { id: "cid", username: "cid", roleId: "sailor" },
  { id: "dee", username: "dee", roleId: "imp" },
];

test("a Traveller who wasn't there on the first page joined late; one gone by the last page left early", () => {
  const joinedLate = game([
    page([...others, ann()]),
    page([...others, ann("beggar")]),
    page([...others, ann("beggar")]),
  ]);
  const leftEarly = game([
    page([...others, ann("beggar")]),
    page([...others, ann("beggar")]),
    page([...others, ann()]),
  ]);
  const thereThroughout = game([page([...others, ann("beggar")]), page([...others, ann("beggar")])]);

  const late = preview("traveller_joined_late", [joinedLate, leftEarly, thereThroughout]);
  assert.equal(late.count, 1);
  assert.equal(late.subtitle, "Most often as the Beggar");
  assert.equal(late.displayRole?.id, "beggar");

  const early = preview("traveller_left_early", [joinedLate, leftEarly, thereThroughout]);
  assert.equal(early.count, 1);
});

test("a seat that is only linked to the account later is not a late Traveller", () => {
  const linkedLater = game([
    page([...others, { id: "ann", roleId: "beggar" }]),
    page([...others, ann("beggar")]),
  ]);
  assert.equal(preview("traveller_joined_late", [linkedLater]).count, 0);
});

test("a player who isn't a Traveller doesn't count as joining late", () => {
  const notTraveller = game([page([...others, ann()]), page([...others, ann("chef")])]);
  assert.equal(preview("traveller_joined_late", [notTraveller]).count, 0);
});

test("poisoned, mad and executed count what happened to this player only", () => {
  const played = game(
    [page([...others, ann("chef")]), page([...others, ann("chef")])],
    [
      event("POISONED", 0, "ann", "poisoner", "bob"),
      event("POISONED", 1, "ann", "poisoner", "bob"),
      event("POISONED", 1, "cid", "poisoner", "bob"),
      event("EXECUTION", 1, "ann"),
    ]
  );

  const poisoned = preview("poisoned_total", [played]);
  assert.equal(poisoned.count, 2);
  assert.equal(poisoned.sentence, "You've been poisoned 2 times.");
  assert.equal(poisoned.subtitle, "Most often by the Poisoner");

  const executed = preview("executed_total", [played]);
  assert.equal(executed.count, 1);
  assert.equal(executed.subtitle, "Most often as the Chef");

  assert.equal(preview("mad_total", [played]).count, 0);
});

test("drunk counts being made drunk and being the Drunk", () => {
  const madeDrunk = game(
    [page([...others, ann("chef")]), page([...others, ann("chef")])],
    [event("DRUNK", 1, "ann", "sailor", "cid")]
  );
  const theDrunk = game([page([...others, ann("drunk")])]);

  const drunk = preview("drunk_total", [madeDrunk, theDrunk]);
  assert.equal(drunk.count, 2);
  assert.equal(drunk.sentence, "You've been drunk 2 times, including 1 game as the Drunk.");

  assert.equal(
    preview("drunk_total", [theDrunk]).sentence,
    "You've been the Drunk in 1 game."
  );
  assert.equal(preview("drunk_total", [theDrunk]).subtitle, "Most often as the Drunk");
});

test("killed by the Demon and character changes name what did it", () => {
  const played = game(
    [page([...others, ann("chef")]), page([...others, ann("monk")])],
    [
      event("DEATH", 1, "ann", "imp", "dee"),
      event("ROLE_CHANGE", 1, "ann", "poisoner", "bob"),
      event("DEATH", 1, "cid", "imp", "dee"),
    ]
  );

  const killed = preview("killed_by_demon", [played]);
  assert.equal(killed.count, 1);
  assert.equal(killed.subtitle, "Most often by the Imp");

  const changed = preview("character_changed", [played]);
  assert.equal(changed.count, 1);
  assert.equal(changed.sentence, "Your character has been changed once.");
});
