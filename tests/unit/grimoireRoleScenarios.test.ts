import { test } from "node:test";
import assert from "node:assert/strict";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";
import { buildRoleStatCardResult } from "../../composables/useRoleStatCards";

// Scenarios for the roles the simulated games didn't cover. Each one builds a
// small grimoire, generates its events like the server backfill does (the same
// rules as the editor), and checks the stat card that should count them.

const ROLES: Record<string, { name: string; type: string; alignment: "GOOD" | "EVIL" }> = {
  chef: { name: "Chef", type: "TOWNSFOLK", alignment: "GOOD" },
  empath: { name: "Empath", type: "TOWNSFOLK", alignment: "GOOD" },
  monk: { name: "Monk", type: "TOWNSFOLK", alignment: "GOOD" },
  recluse: { name: "Recluse", type: "OUTSIDER", alignment: "GOOD" },
  poisoner: { name: "Poisoner", type: "MINION", alignment: "EVIL" },
  vortox: { name: "Vortox", type: "DEMON", alignment: "EVIL" },
  no_dashii: { name: "No Dashii", type: "DEMON", alignment: "EVIL" },
  vigormortis: { name: "Vigormortis", type: "DEMON", alignment: "EVIL" },
  zombuul: { name: "Zombuul", type: "DEMON", alignment: "EVIL" },
  shabaloth: { name: "Shabaloth", type: "DEMON", alignment: "EVIL" },
  po: { name: "Po", type: "DEMON", alignment: "EVIL" },
  scapegoat: { name: "Scapegoat", type: "TRAVELER", alignment: "GOOD" },
  gunslinger: { name: "Gunslinger", type: "TRAVELER", alignment: "GOOD" },
  beggar: { name: "Beggar", type: "TRAVELER", alignment: "GOOD" },
  bureaucrat: { name: "Bureaucrat", type: "TRAVELER", alignment: "GOOD" },
  thief: { name: "Thief", type: "TRAVELER", alignment: "EVIL" },
  butcher: { name: "Butcher", type: "TRAVELER", alignment: "GOOD" },
  bone_collector: { name: "Bone Collector", type: "TRAVELER", alignment: "GOOD" },
  harlot: { name: "Harlot", type: "TRAVELER", alignment: "GOOD" },
  barista: { name: "Barista", type: "TRAVELER", alignment: "GOOD" },
  deviant: { name: "Deviant", type: "TRAVELER", alignment: "GOOD" },
  matron: { name: "Matron", type: "TRAVELER", alignment: "GOOD" },
  judge: { name: "Judge", type: "TRAVELER", alignment: "GOOD" },
  cacklejack: { name: "Cacklejack", type: "TRAVELER", alignment: "GOOD" },
  gangster: { name: "Gangster", type: "TRAVELER", alignment: "EVIL" },
  gnome: { name: "Gnome", type: "TRAVELER", alignment: "GOOD" },
  witch: { name: "Witch", type: "MINION", alignment: "EVIL" },
  "pit-hag": { name: "Pit-Hag", type: "MINION", alignment: "EVIL" },
  imp: { name: "Imp", type: "DEMON", alignment: "EVIL" },
  ventriloquist: { name: "Ventriloquist", type: "LORIC", alignment: "GOOD" },
};

type Reminder = { reminder: string; token_url: string };
type Seat = {
  id: string;
  role: string;
  dead?: boolean;
  alignment?: "GOOD" | "EVIL";
  reminders?: Reminder[];
};

/** A reminder from a role's token, like the dialog places it. */
function r(roleId: string, reminder: string): Reminder {
  return { reminder, token_url: `/img/role/${roleId.replace(/_/g, "")}.webp` };
}

let nextTokenId = 1;
function page(seats: Seat[]) {
  return {
    id: nextTokenId,
    tokens: seats.map((seat, order) => ({
      id: nextTokenId++,
      order,
      player_name: seat.id,
      player_id: null,
      role_id: seat.role,
      related_role_id: null,
      alignment: seat.alignment ?? ROLES[seat.role].alignment,
      is_dead: seat.dead ?? false,
      grimoire_participant_id: seat.id,
      reminders: seat.reminders ?? [],
      role: {
        name: ROLES[seat.role].name,
        type: ROLES[seat.role].type,
        initial_alignment: ROLES[seat.role].alignment,
        token_url: "",
      },
      player: { username: seat.id },
    })),
  };
}

function scenario(pages: ReturnType<typeof page>[]) {
  const { events } = generateEventsForMissingGames(pages as any);
  const game = {
    ignore_for_stats: false,
    win_v2: "NOT_RECORDED",
    player_characters: [],
    grimoire: pages,
    grimoire_events: events.map((event, index) => ({ ...event, id: index + 1 })),
  } as any;

  return {
    events,
    of: (type: string, participantId?: string) =>
      events.filter(
        (event) =>
          event.event_type === type &&
          (!participantId || event.participant_id === participantId)
      ),
    card: (metricKey: string, roleId: string, username: string) =>
      buildRoleStatCardResult(
        {
          id: 1,
          role_id: roleId,
          source: "grimoire_event",
          metric_key: metricKey,
          storyteller_only: false,
          role: { name: ROLES[roleId]?.name ?? roleId },
        } as any,
        [game],
        true,
        username
      ).count,
  };
}

// --- Demons -----------------------------------------------------------------

test("Po: three kills in one night", () => {
  const before = [
    { id: "po", role: "po" },
    { id: "a", role: "chef" },
    { id: "b", role: "empath" },
    { id: "c", role: "monk" },
  ];
  const s = scenario([
    page(before),
    page([
      { id: "po", role: "po" },
      { id: "a", role: "chef", dead: true, reminders: [r("po", "Dead")] },
      { id: "b", role: "empath", dead: true, reminders: [r("po", "Dead")] },
      { id: "c", role: "monk", dead: true, reminders: [r("po", "Dead")] },
    ]),
  ]);
  assert.equal(s.of("DEATH").filter((e) => e.by_role_id === "po").length, 3);
  assert.equal(s.card("po_kills", "po", "po"), 3);
  assert.equal(s.card("po_triple_kills", "po", "po"), 1);
});

test("Shabaloth: a kill, then the player is regurgitated", () => {
  const s = scenario([
    page([
      { id: "sh", role: "shabaloth" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "sh", role: "shabaloth" },
      { id: "a", role: "chef", dead: true, reminders: [r("shabaloth", "Dead")] },
    ]),
    page([
      { id: "sh", role: "shabaloth" },
      { id: "a", role: "chef", reminders: [r("shabaloth", "Alive")] },
    ]),
  ]);
  const revivals = s.of("REVIVE", "a");
  assert.equal(revivals.length, 1);
  assert.equal(revivals[0].by_role_id, "shabaloth");
  assert.equal(s.card("shabaloth_kills", "shabaloth", "sh"), 1);
  assert.equal(s.card("shabaloth_revives", "shabaloth", "sh"), 1);
});

test("No Dashii: both Townsfolk neighbours poisoned", () => {
  const s = scenario([
    page([
      { id: "a", role: "chef", reminders: [r("no_dashii", "Poisoned")] },
      { id: "nd", role: "no_dashii" },
      { id: "b", role: "empath", reminders: [r("no_dashii", "Poisoned")] },
    ]),
  ]);
  assert.equal(s.of("POISONED").filter((e) => e.by_role_id === "no_dashii").length, 2);
  assert.equal(s.card("no_dashii_poisoned_received", "no_dashii", "a"), 1);
});

test("Vigormortis: kills its own Minion, who poisons a Townsfolk neighbour", () => {
  const s = scenario([
    page([
      { id: "v", role: "vigormortis" },
      { id: "m", role: "poisoner" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "v", role: "vigormortis" },
      { id: "m", role: "poisoner", dead: true, reminders: [r("vigormortis", "Dead")] },
      { id: "a", role: "chef", reminders: [r("vigormortis", "Poisoned")] },
    ]),
  ]);
  assert.equal(s.card("vigormortis_kills", "vigormortis", "v"), 1);
  assert.equal(s.card("vigormortis_minion_kills", "vigormortis", "v"), 1);
  assert.equal(s.card("vigormortis_poisoned_received", "vigormortis", "a"), 1);
});

test("Zombuul: registers as dead after its first death", () => {
  const s = scenario([
    page([{ id: "z", role: "zombuul" }]),
    page([{ id: "z", role: "zombuul", reminders: [r("zombuul", "Registers As Dead")] }]),
  ]);
  assert.equal(s.card("zombuul_false_deaths", "zombuul", "z"), 1);
});

test("Vortox: a night kill", () => {
  const s = scenario([
    page([
      { id: "vx", role: "vortox" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "vx", role: "vortox" },
      { id: "a", role: "chef", dead: true, reminders: [r("vortox", "Dead")] },
    ]),
  ]);
  assert.equal(s.card("vortox_kills", "vortox", "vx"), 1);
});

// --- Travellers ---------------------------------------------------------------

test("Matron: swapping two neighbours is one swap, credited to the Matron", () => {
  const swapped = r("matron", "Swapped");
  const s = scenario([
    page([
      { id: "a", role: "chef" },
      { id: "b", role: "empath" },
      { id: "c", role: "monk" },
      { id: "m", role: "matron" },
    ]),
    page([
      { id: "b", role: "empath", reminders: [swapped] },
      { id: "a", role: "chef", reminders: [swapped] },
      { id: "c", role: "monk" },
      { id: "m", role: "matron" },
    ]),
  ]);
  const seatChanges = s.of("SEAT_CHANGE");
  assert.equal(seatChanges.length, 2);
  assert.ok(seatChanges.every((event) => event.by_role_id === "matron"));
  assert.equal(s.card("matron_seat_changes_caused", "matron", "m"), 1);
});

test("Harlot: the Harlot and their chosen player die together", () => {
  const s = scenario([
    page([
      { id: "h", role: "harlot" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "h", role: "harlot", dead: true, reminders: [r("harlot", "Dead")] },
      { id: "a", role: "chef", dead: true, reminders: [r("harlot", "Dead")] },
    ]),
  ]);
  assert.equal(s.of("DEATH").filter((e) => e.by_role_id === "harlot").length, 2);
  assert.equal(s.card("harlot_deaths", "harlot", "h"), 1);
});

test("Gangster: kills a neighbour", () => {
  const s = scenario([
    page([
      { id: "g", role: "gangster" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "g", role: "gangster" },
      { id: "a", role: "chef", dead: true, reminders: [r("gangster", "Dead")] },
    ]),
  ]);
  assert.equal(s.card("gangster_kills", "gangster", "g"), 1);
});

test("Gnome: marks an amigo and kills their nominator", () => {
  const s = scenario([
    page([
      { id: "gn", role: "gnome" },
      { id: "a", role: "chef", reminders: [r("gnome", "Amigo")] },
      { id: "b", role: "empath" },
    ]),
    page([
      { id: "gn", role: "gnome" },
      { id: "a", role: "chef", reminders: [r("gnome", "Amigo")] },
      { id: "b", role: "empath", dead: true, reminders: [r("gnome", "Dead")] },
    ]),
  ]);
  assert.equal(s.card("gnome_amigo_marked", "gnome", "a"), 1);
  assert.equal(s.card("gnome_kills", "gnome", "gn"), 1);
});

test("Gunslinger: shoots a voter (one death, not two)", () => {
  const s = scenario([
    page([
      { id: "gs", role: "gunslinger" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "gs", role: "gunslinger" },
      { id: "a", role: "chef", dead: true, reminders: [r("gunslinger", "Dead")] },
    ]),
  ]);
  assert.equal(s.of("DEATH", "a").length + s.of("NOT_RECORDED", "a").length, 1);
  assert.equal(s.card("gunslinger_kills", "gunslinger", "gs"), 1);
});

test("Butcher: the second execution of the day", () => {
  const s = scenario([
    page([
      { id: "bu", role: "butcher" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "bu", role: "butcher" },
      { id: "a", role: "chef", dead: true, reminders: [r("butcher", "Executed")] },
    ]),
  ]);
  const executions = s.of("EXECUTION", "a");
  assert.equal(executions.length, 1);
  assert.equal(executions[0].by_role_id, "butcher");
  assert.equal(s.card("butcher_additional_executions", "butcher", "bu"), 1);
});

test("Judge: forces one execution and stops another", () => {
  const s = scenario([
    page([
      { id: "j", role: "judge" },
      { id: "a", role: "chef" },
      { id: "b", role: "empath" },
    ]),
    page([
      { id: "j", role: "judge", reminders: [r("judge", "No Ability")] },
      { id: "a", role: "chef", dead: true, reminders: [r("judge", "Executed")] },
      { id: "b", role: "empath", reminders: [r("judge", "Execution Failed")] },
    ]),
  ]);
  const executions = s.of("EXECUTION", "a");
  assert.equal(executions.length, 1);
  assert.equal(executions[0].by_role_id, "judge");
  assert.equal(s.card("judge_executions_caused", "judge", "j"), 1);
  assert.equal(s.card("judge_failed_executions_caused", "judge", "j"), 1);
});

test("Scapegoat: executed in someone else's place", () => {
  const s = scenario([
    page([{ id: "sg", role: "scapegoat" }]),
    page([{ id: "sg", role: "scapegoat", dead: true, reminders: [r("scapegoat", "Executed")] }]),
  ]);
  assert.equal(s.of("EXECUTION", "sg").length, 1);
  assert.equal(s.card("scapegoat_ability_executions", "scapegoat", "sg"), 1);
});

test("Cacklejack: changes another player's character", () => {
  const s = scenario([
    page([
      { id: "ck", role: "cacklejack" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "ck", role: "cacklejack" },
      { id: "a", role: "empath", reminders: [r("cacklejack", "Changed")] },
    ]),
  ]);
  const changes = s.of("ROLE_CHANGE", "a");
  assert.equal(changes.length, 1);
  assert.equal(changes[0].by_role_id, "cacklejack");
  assert.equal(s.card("cacklejack_role_changes_caused", "cacklejack", "ck"), 1);
  assert.equal(s.card("cacklejack_role_changes_received", "cacklejack", "a"), 1);
});

test("Bone Collector: a dead player regains their ability", () => {
  const s = scenario([
    page([
      { id: "bc", role: "bone_collector" },
      { id: "a", role: "chef", dead: true },
    ]),
    page([
      { id: "bc", role: "bone_collector", reminders: [r("bone_collector", "No Ability")] },
      { id: "a", role: "chef", dead: true, reminders: [r("bone_collector", "Has Ability")] },
    ]),
  ]);
  assert.equal(s.card("bone_collector_restored_abilities", "bone_collector", "bc"), 1);
});

test("Beggar, Bureaucrat and Thief: vote reminders", () => {
  const s = scenario([
    page([
      { id: "be", role: "beggar", reminders: [r("beggar", "Vote Given")] },
      { id: "bc", role: "bureaucrat" },
      { id: "t", role: "thief" },
      { id: "a", role: "chef", reminders: [r("bureaucrat", "3 Votes")] },
      { id: "b", role: "empath", reminders: [r("thief", "Negative Vote")] },
    ]),
  ]);
  assert.equal(s.card("beggar_votes_received", "beggar", "be"), 1);
  assert.equal(s.card("bureaucrat_extra_votes_given", "bureaucrat", "bc"), 1);
  assert.equal(s.card("bureaucrat_extra_votes_received", "bureaucrat", "a"), 1);
  assert.equal(s.card("thief_votes_stolen", "thief", "t"), 1);
  assert.equal(s.card("thief_votes_stolen_received", "thief", "b"), 1);
});

test("Deviant and Barista: saved from exile, acts twice", () => {
  const s = scenario([
    page([
      { id: "dv", role: "deviant", reminders: [r("deviant", "Saved")] },
      { id: "ba", role: "barista" },
      { id: "a", role: "chef", reminders: [r("barista", "Acts Twice")] },
    ]),
  ]);
  assert.equal(s.card("deviant_exiles_avoided", "deviant", "dv"), 1);
  assert.equal(s.card("barista_acts_twice_given", "barista", "ba"), 1);
});

// --- Fabled and Loric (not seated: reminders sit on the affected player) -------

test("Angel, Doomsayer, Hell's Librarian and Big Wig: deaths credited to the Fabled", () => {
  const s = scenario([
    page([
      { id: "a", role: "chef" },
      { id: "b", role: "empath" },
      { id: "c", role: "monk" },
      { id: "d", role: "recluse" },
    ]),
    page([
      { id: "a", role: "chef", dead: true, reminders: [r("angel", "Dead")] },
      { id: "b", role: "empath", dead: true, reminders: [r("doomsayer", "Dead")] },
      { id: "c", role: "monk", dead: true, reminders: [r("hells_librarian", "Dead")] },
      { id: "d", role: "recluse", dead: true, reminders: [r("big_wig", "Dead")] },
    ]),
  ]);
  assert.deepEqual(
    s.of("DEATH").map((e) => `${e.participant_id}:${e.by_role_id}`),
    ["a:angel", "b:doomsayer", "c:hells_librarian", "d:big_wig"]
  );
  assert.equal(s.card("angel_deaths", "angel", "a"), 1);
  assert.equal(s.card("doomsayer_deaths", "doomsayer", "b"), 1);
  assert.equal(s.card("hells_librarian_deaths", "hells_librarian", "c"), 1);
  assert.equal(s.card("big_wig_deaths_received", "big_wig", "d"), 1);
});

test("Storm Catcher and Zenomancer: protection and goals", () => {
  const s = scenario([
    page([
      { id: "a", role: "chef", reminders: [r("storm_catcher", "Safe")] },
      { id: "b", role: "empath", reminders: [r("zenomancer", "Goal")] },
    ]),
    page([
      { id: "a", role: "chef", reminders: [r("storm_catcher", "Safe")] },
      { id: "b", role: "empath", reminders: [r("zenomancer", "Goal Completed")] },
    ]),
  ]);
  assert.equal(s.card("storm_catcher_protected_received", "storm_catcher", "a"), 1);
  assert.equal(s.card("zenomancer_goals_assigned_received", "zenomancer", "b"), 1);
  assert.equal(s.card("zenomancer_goals_completed_received", "zenomancer", "b"), 1);
});

test("Hindu: a dead player comes back as a Traveller", () => {
  const s = scenario([
    page([{ id: "a", role: "chef" }]),
    page([{ id: "a", role: "chef", dead: true }]),
    page([{ id: "a", role: "beggar", reminders: [r("hindu", "Reincarnated")] }]),
  ]);
  const revivals = s.of("REVIVE", "a");
  assert.equal(revivals.length, 1);
  assert.equal(revivals[0].by_role_id, "hindu");
  // The revive and the character change are one reincarnation.
  assert.equal(s.of("ROLE_CHANGE", "a")[0]?.by_role_id, "hindu");
  assert.equal(s.card("hindu_revives", "hindu", "a"), 1);
});

test("Hindu: counts once when the storyteller skips the dead page", () => {
  const s = scenario([
    page([{ id: "a", role: "chef" }]),
    page([{ id: "a", role: "beggar", reminders: [r("hindu", "Reincarnated")] }]),
  ]);
  assert.equal(s.of("REVIVE", "a").length, 0);
  assert.equal(s.of("ROLE_CHANGE", "a")[0]?.by_role_id, "hindu");
  assert.equal(s.card("hindu_revives", "hindu", "a"), 1);
});

test("Witch: a cursed nominator dies", () => {
  const s = scenario([
    page([
      { id: "w", role: "witch" },
      { id: "a", role: "chef", reminders: [r("witch", "Cursed")] },
    ]),
    page([
      { id: "w", role: "witch" },
      { id: "a", role: "chef", dead: true, reminders: [r("witch", "Dead")] },
    ]),
  ]);
  assert.deepEqual(
    s.of("DEATH").map((e) => `${e.participant_id}:${e.by_role_id}`),
    ["a:witch"]
  );
  assert.equal(s.card("witch_kills", "witch", "w"), 1);
});

test("Deviant: only a Saved on the Deviant itself counts", () => {
  const s = scenario([
    page([
      { id: "dv", role: "deviant" },
      { id: "a", role: "chef" },
    ]),
    page([
      { id: "dv", role: "deviant", reminders: [r("deviant", "Saved")] },
      { id: "a", role: "chef", reminders: [r("deviant", "Saved")] },
    ]),
  ]);
  assert.deepEqual(
    s.of("OTHER").map((e) => `${e.participant_id}:${e.status_source}`),
    ["dv:Saved"]
  );
  assert.equal(s.card("deviant_exiles_avoided", "deviant", "dv"), 1);
});

test("Ventriloquist: an executed player who didn't die is credited to the Loric", () => {
  const s = scenario([
    page([{ id: "a", role: "chef" }]),
    page([{ id: "a", role: "chef", reminders: [r("ventriloquist", "Saved")] }]),
  ]);
  assert.deepEqual(
    s.of("OTHER", "a").map((e) => `${e.by_role_id}:${e.status_source}`),
    ["ventriloquist:Saved"]
  );
});

test("Pit-Hag: arbitrary deaths after making a Demon", () => {
  const s = scenario([
    page([
      { id: "ph", role: "pit-hag" },
      { id: "a", role: "chef" },
      { id: "b", role: "empath" },
    ]),
    page([
      { id: "ph", role: "pit-hag" },
      { id: "a", role: "imp", alignment: "GOOD", reminders: [r("pit-hag", "Changed")] },
      { id: "b", role: "empath", dead: true, reminders: [r("pit-hag", "Dead")] },
    ]),
  ]);
  assert.deepEqual(
    s.of("DEATH").map((e) => `${e.participant_id}:${e.by_participant_id}:${e.by_role_id}`),
    ["b:ph:pit-hag"]
  );
  assert.equal(s.card("pit_hag_arbitrary_deaths", "pit-hag", "ph"), 1);
});
