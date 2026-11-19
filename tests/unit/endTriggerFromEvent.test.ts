import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveEndTriggerFromEvent } from "../../composables/endTriggerFromEvent";

const ROLES: Record<string, { name: string; type: string; initial_alignment: "GOOD" | "EVIL" }> = {
  imp: { name: "Imp", type: "DEMON", initial_alignment: "EVIL" },
  poisoner: { name: "Poisoner", type: "MINION", initial_alignment: "EVIL" },
  slayer: { name: "Slayer", type: "TOWNSFOLK", initial_alignment: "GOOD" },
  saint: { name: "Saint", type: "OUTSIDER", initial_alignment: "GOOD" },
  chef: { name: "Chef", type: "TOWNSFOLK", initial_alignment: "GOOD" },
  pit_hag: { name: "Pit-Hag", type: "MINION", initial_alignment: "EVIL" },
  scapegoat: { name: "Scapegoat", type: "TRAVELER", initial_alignment: "GOOD" },
};

const resolveRole = (id: string | null | undefined) =>
  id && ROLES[id] ? { ...ROLES[id], token_url: `/${id}.webp` } : null;

function tok(id: string, role: string, isDead = false) {
  return { player_name: id, role_id: role, is_dead: isDead, grimoire_participant_id: id };
}

function ev(overrides: Record<string, unknown>) {
  return {
    grimoire_page: 1,
    participant_id: "",
    event_type: null,
    cause: null,
    by_participant_id: null,
    by_role_id: null,
    role_id: null,
    old_role_id: null,
    new_role_id: null,
    ...overrides,
  } as any;
}

const firstPage = { tokens: [tok("a", "imp"), tok("b", "slayer"), tok("c", "chef"), tok("d", "poisoner")] };

test("slayer shooting the only demon ends the game with no living demon", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp", true), tok("b", "slayer"), tok("c", "chef"), tok("d", "poisoner")] }];
  const result = deriveEndTriggerFromEvent(
    ev({ participant_id: "a", event_type: "DEATH", cause: "ABILITY", by_participant_id: "b", by_role_id: "slayer" }),
    pages,
    resolveRole
  );
  assert.equal(result?.end_trigger, "NO_LIVING_DEMON");
  assert.equal(result?.end_trigger_type, "DEATH");
  assert.equal(result?.end_trigger_cause, "ABILITY");
  assert.equal(result?.end_trigger_participant_id, "b");
  assert.equal(result?.end_trigger_role?.name, "Slayer");
});

test("events on earlier pages are not offered", () => {
  const pages = [{ tokens: [tok("a", "imp", true)] }, { tokens: [tok("a", "imp", true)] }];
  assert.equal(deriveEndTriggerFromEvent(ev({ grimoire_page: 0, participant_id: "a", event_type: "DEATH" }), pages, resolveRole), null);
});

test("a demon death with another living demon does not end the game", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp", true), tok("b", "slayer"), tok("d", "imp")] }];
  assert.equal(deriveEndTriggerFromEvent(ev({ participant_id: "a", event_type: "DEATH" }), pages, resolveRole), null);
});

test("killing down to two living players ends the game, ignoring travellers", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp"), tok("b", "slayer", true), tok("c", "chef"), tok("d", "poisoner", true), tok("e", "scapegoat")] }];
  const result = deriveEndTriggerFromEvent(ev({ participant_id: "b", event_type: "DEATH", by_participant_id: "a", by_role_id: "imp" }), pages, resolveRole);
  assert.equal(result?.end_trigger, "TWO_PLAYERS_LEFT_ALIVE");
  assert.equal(result?.end_trigger_cause, "ABILITY");
});

test("a non-demon death with more than two living players is not offered", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp"), tok("b", "slayer", true), tok("c", "chef"), tok("d", "poisoner")] }];
  assert.equal(deriveEndTriggerFromEvent(ev({ participant_id: "b", event_type: "DEATH" }), pages, resolveRole), null);
});

test("executing the demon by nomination", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp", true), tok("b", "slayer"), tok("c", "chef"), tok("d", "poisoner")] }];
  const result = deriveEndTriggerFromEvent(ev({ participant_id: "a", event_type: "EXECUTION", cause: "NOMINATION" }), pages, resolveRole);
  assert.equal(result?.end_trigger, "NO_LIVING_DEMON");
  assert.equal(result?.end_trigger_type, "EXECUTION");
  assert.equal(result?.end_trigger_cause, "NOMINATION");
  assert.equal(result?.end_trigger_role_id, null);
});

test("executing the saint is an additional win condition", () => {
  const pages = [firstPage, { tokens: [tok("a", "imp"), tok("b", "saint", true), tok("c", "chef"), tok("d", "poisoner")] }];
  const result = deriveEndTriggerFromEvent(ev({ participant_id: "b", event_type: "EXECUTION", cause: "NOMINATION" }), pages, resolveRole);
  assert.equal(result?.end_trigger, "ADDITIONAL_WIN_CONDITION");
  assert.equal(result?.end_trigger_type, null);
  assert.equal(result?.end_trigger_role_id, "saint");
  assert.equal(result?.end_trigger_participant_id, "b");
});

test("the pit-hag turning the demon into a non-demon", () => {
  const pages = [firstPage, { tokens: [tok("a", "chef"), tok("b", "slayer"), tok("c", "chef"), tok("d", "pit_hag")] }];
  const result = deriveEndTriggerFromEvent(
    ev({ participant_id: "a", event_type: "ROLE_CHANGE", old_role_id: "imp", new_role_id: "chef", by_participant_id: "d", by_role_id: "pit_hag" }),
    pages,
    resolveRole
  );
  assert.equal(result?.end_trigger, "NO_LIVING_DEMON");
  assert.equal(result?.end_trigger_type, "CHARACTER_CHANGE");
  assert.equal(result?.end_trigger_role_id, "pit_hag");
});
