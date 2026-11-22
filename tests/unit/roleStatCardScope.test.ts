import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildRoleStatCardResult,
  getRoleStatCardDefinition,
} from "../../composables/useRoleStatCards";

type Seat = { id: string; username: string; roleId: string; type: string };

const ROLES: Record<string, { name: string; type: string }> = {
  imp: { name: "Imp", type: "DEMON" },
  fang_gu: { name: "Fang Gu", type: "DEMON" },
  scarlet_woman: { name: "Scarlet Woman", type: "MINION" },
  vizier: { name: "Vizier", type: "MINION" },
  chef: { name: "Chef", type: "TOWNSFOLK" },
  farmer: { name: "Farmer", type: "TOWNSFOLK" },
  harpy: { name: "Harpy", type: "MINION" },
  goblin: { name: "Goblin", type: "MINION" },
};

function page(seats: Seat[]) {
  return {
    tokens: seats.map((seat, order) => ({
      order,
      grimoire_participant_id: seat.id,
      role_id: seat.roleId,
      role: { ...ROLES[seat.roleId], token_url: "" },
      alignment: ROLES[seat.roleId].type === "TOWNSFOLK" ? "GOOD" : "EVIL",
      is_dead: false,
      player: { username: seat.username },
    })),
  };
}

let nextEventId = 1;
function event(
  type: string,
  page: number,
  participantId: string,
  byRoleId: string | null,
  byParticipantId: string | null
) {
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

function card(metricKey: string, roleId: string) {
  return {
    id: 1,
    role_id: roleId,
    source: "grimoire_event",
    metric_key: metricKey,
    storyteller_only: false,
    role: { name: ROLES[roleId].name },
  } as any;
}

// Alice is the Imp and kills two players, then starpasses to Bob (the Scarlet
// Woman), who kills one more.
const starpassGame = {
  ignore_for_stats: false,
  grimoire: [
    page([
      { id: "alice", username: "alice", roleId: "imp", type: "DEMON" },
      { id: "bob", username: "bob", roleId: "scarlet_woman", type: "MINION" },
      { id: "cara", username: "cara", roleId: "chef", type: "TOWNSFOLK" },
    ]),
    page([
      { id: "alice", username: "alice", roleId: "imp", type: "DEMON" },
      { id: "bob", username: "bob", roleId: "imp", type: "DEMON" },
      { id: "cara", username: "cara", roleId: "chef", type: "TOWNSFOLK" },
    ]),
  ],
  grimoire_events: [
    event("DEATH", 0, "x1", "imp", "alice"),
    event("DEATH", 0, "x2", "imp", "alice"),
    event("ROLE_CHANGE", 1, "bob", "imp", "alice"),
    event("DEATH", 1, "x3", "imp", "bob"),
  ],
} as any;

test("Imp kills only count for the player who held the Imp", () => {
  const alice = buildRoleStatCardResult(card("imp_kills", "imp"), [starpassGame], true, "alice");
  const bob = buildRoleStatCardResult(card("imp_kills", "imp"), [starpassGame], true, "bob");
  assert.equal(alice.count, 2);
  assert.equal(bob.count, 1);
});

test("the starpass counts for the Imp who passed it, not the new Imp", () => {
  const alice = buildRoleStatCardResult(card("imp_starpasses", "imp"), [starpassGame], true, "alice");
  const bob = buildRoleStatCardResult(card("imp_starpasses", "imp"), [starpassGame], true, "bob");
  assert.equal(alice.count, 1);
  assert.equal(bob.count, 0);
});

test("events with no recorded source still count", () => {
  const game = {
    ...starpassGame,
    grimoire_events: [event("DEATH", 0, "x1", "imp", null)],
  };
  const alice = buildRoleStatCardResult(card("imp_kills", "imp"), [game], true, "alice");
  assert.equal(alice.count, 1);
});

test("cards about something done to the role holder still count", () => {
  const game = {
    ignore_for_stats: false,
    grimoire: [
      page([
        { id: "vic", username: "vic", roleId: "vizier", type: "MINION" },
        { id: "dan", username: "dan", roleId: "imp", type: "DEMON" },
      ]),
    ],
    grimoire_events: [event("DEATH", 0, "vic", "imp", "dan")],
  } as any;
  const vic = buildRoleStatCardResult(card("vizier_killed_by_demon", "vizier"), [game], true, "vic");
  assert.equal(vic.count, 1);
});

test("the Fang Gu's own death when it jumps is not a kill", () => {
  const jumped = { ...event("DEATH", 1, "finn", "fang_gu", "finn"), status_source: "Jumped" };
  const game = {
    ignore_for_stats: false,
    grimoire: [page([{ id: "finn", username: "finn", roleId: "fang_gu", type: "DEMON" }])],
    grimoire_events: [event("DEATH", 0, "x1", "fang_gu", "finn"), jumped],
  } as any;
  const finn = buildRoleStatCardResult(card("fang_gu_kills", "fang_gu"), [game], true, "finn");
  assert.equal(finn.count, 1);
});

test("the Farmer's new Farmer counts for the Farmer who died, whoever recorded the game", () => {
  // Ann is the Farmer and dies; Ben becomes a Farmer. The storyteller recorded it.
  const game = {
    ignore_for_stats: false,
    user_id: "storyteller",
    grimoire: [
      page([
        { id: "ann", username: "ann", roleId: "farmer", type: "TOWNSFOLK" },
        { id: "ben", username: "ben", roleId: "chef", type: "TOWNSFOLK" },
      ]),
      page([
        { id: "ann", username: "ann", roleId: "farmer", type: "TOWNSFOLK" },
        { id: "ben", username: "ben", roleId: "farmer", type: "TOWNSFOLK" },
      ]),
    ],
    grimoire_events: [event("ROLE_CHANGE", 1, "ben", "farmer", "ann")],
  } as any;
  const ann = buildRoleStatCardResult(card("farmer_role_changes", "farmer"), [game], true, "ann");
  const ben = buildRoleStatCardResult(card("farmer_role_changes", "farmer"), [game], true, "ben");
  assert.equal(ann.count, 1);
  assert.equal(ben.count, 0);
});

test("a Harpy final-two ending counts as a death, and older ones saved as an execution still count", () => {
  const ending = (type: string) => ({
    ignore_for_stats: false,
    end_trigger: "TWO_PLAYERS_LEFT_ALIVE",
    end_trigger_type: type,
    end_trigger_cause: "ABILITY",
    end_trigger_role_id: "harpy",
    end_trigger_participant_alignment: "EVIL",
    win_v2: "EVIL_WINS",
    player_characters: [],
    grimoire: [page([{ id: "hal", username: "hal", roleId: "harpy", type: "MINION" }])],
    grimoire_events: [],
  });
  const games = [ending("DEATH"), ending("EXECUTION")] as any;
  const hal = buildRoleStatCardResult(card("harpy_game_ending", "harpy"), games, true, "hal");
  assert.equal(hal.count, 2);
  assert.match(hal.sentence, /causing a death for breaking madness/);
});

test("a claimed Goblin execution counts on the role page without grimoire tokens", () => {
  const execution = { ...event("EXECUTION", 0, "gob", null, "nina"), role_id: "goblin" };
  const claimed = { ...event("OTHER", 0, "gob", "goblin", null), status_source: "Claimed" };
  // The role page loads no tokens for this card.
  const game = { ignore_for_stats: false, grimoire: [{}], grimoire_events: [execution, claimed] } as any;
  const definition = getRoleStatCardDefinition("goblin_executions_caused")!;
  assert.equal(definition.getCount({ games: [game], roleId: "goblin" }), 1);
  assert.equal(definition.globalDataNeeds?.includes("grimoire_state"), false);
});

// General cards count what this player did, whatever their role.
function generalCard(metricKey: string) {
  return {
    id: 1,
    role_id: null,
    source: "end_trigger",
    metric_key: metricKey,
    storyteller_only: false,
    role: null,
  } as any;
}

function endedGame(triggerParticipantId: string | null) {
  return {
    ignore_for_stats: false,
    grimoire: [
      page([
        { id: "steven", username: "steven", roleId: "chef", type: "TOWNSFOLK" },
        { id: "stef", username: "stef", roleId: "farmer", type: "TOWNSFOLK" },
      ]),
    ],
    grimoire_events: [],
    end_trigger: "NO_LIVING_DEMON",
    end_trigger_cause: "ABILITY",
    end_trigger_participant_id: triggerParticipantId,
    end_trigger_role: { id: "slayer", name: "Slayer", token_url: "", type: "TOWNSFOLK" },
  } as any;
}

test("general end-trigger cards only count games this player ended", () => {
  const games = [endedGame("steven"), endedGame("stef"), endedGame(null)];
  const count = (username: string) =>
    buildRoleStatCardResult(generalCard("game_ending_abilities"), games, true, username).count;
  assert.equal(count("steven"), 1);
  assert.equal(count("stef"), 1);
});

test("Look What I Can Do! skips a Demon's ordinary kill down to two players", () => {
  const ended = (
    endTrigger: string,
    role: { id: string; name: string; type: string }
  ) => ({
    ...endedGame("steven"),
    end_trigger: endTrigger,
    end_trigger_role: { ...role, token_url: "" },
  });
  const games = [
    ended("NO_LIVING_DEMON", { id: "slayer", name: "Slayer", type: "TOWNSFOLK" }),
    ended("TWO_PLAYERS_LEFT_ALIVE", { id: "imp", name: "Imp", type: "DEMON" }),
    ended("TWO_PLAYERS_LEFT_ALIVE", { id: "assassin", name: "Assassin", type: "MINION" }),
    ended("ADDITIONAL_WIN_CONDITION", { id: "vortox", name: "Vortox", type: "DEMON" }),
  ] as any[];
  const result = buildRoleStatCardResult(
    generalCard("game_ending_abilities"),
    games,
    true,
    "steven"
  );
  assert.equal(result.count, 3);
});

test("general event cards only count events this player caused", () => {
  const count = (username: string) =>
    buildRoleStatCardResult(generalCard("demon_kills_total"), [starpassGame], true, username)
      .count;
  assert.equal(count("alice"), 2);
  assert.equal(count("bob"), 1);
  assert.equal(count("cara"), 0);
});
