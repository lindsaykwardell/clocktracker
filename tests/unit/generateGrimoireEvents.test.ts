import { test } from "node:test";
import assert from "node:assert/strict";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";
import { createGrimoireEventEngine } from "../../composables/grimoireEventEngine";

type Reminder = { reminder: string; token_url: string };

let nextTokenId = 1;

function token(
  participantId: string,
  order: number,
  roleId: string,
  options: { isDead?: boolean; reminders?: Reminder[] } = {}
) {
  return {
    id: nextTokenId++,
    order,
    player_name: participantId,
    player_id: null,
    role_id: roleId,
    related_role_id: null,
    alignment: "GOOD" as const,
    is_dead: options.isDead ?? false,
    grimoire_participant_id: participantId,
    reminders: options.reminders ?? [],
    role: { name: roleId, type: "TOWNSFOLK", initial_alignment: "GOOD" as const },
  };
}

function page(id: number, tokens: ReturnType<typeof token>[]) {
  return { id, tokens };
}

function eventsOfType(
  events: ReturnType<typeof generateEventsForMissingGames>["events"],
  type: string
) {
  return events.filter((event) => event.event_type === type);
}

test("a death reminder on a newly dead player enriches the death instead of adding one", () => {
  const jumped = { reminder: "Jumped", token_url: "/img/role/fanggu.webp" };
  const { events } = generateEventsForMissingGames([
    page(1, [token("finn", 0, "fang_gu"), token("gina", 1, "klutz")]),
    page(2, [
      token("finn", 0, "fang_gu", { isDead: true, reminders: [jumped] }),
      token("gina", 1, "fang_gu"),
    ]),
  ]);

  const deaths = events.filter(
    (event) =>
      event.participant_id === "finn" &&
      ["DEATH", "NOT_RECORDED", "EXECUTION"].includes(event.event_type)
  );
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].event_type, "DEATH");
  assert.equal(deaths[0].status_source, "Jumped");
  assert.equal(deaths[0].by_role_id, "fang_gu");
});

test("a revive reminder enriches the revival instead of adding a second one", () => {
  const alive = { reminder: "Alive", token_url: "/img/role/professor.webp" };
  const { events } = generateEventsForMissingGames([
    page(1, [token("alice", 0, "professor"), token("gina", 1, "chef", { isDead: true })]),
    page(2, [
      token("alice", 0, "professor"),
      token("gina", 1, "chef", { reminders: [alive] }),
    ]),
  ]);

  const revivals = eventsOfType(events, "REVIVE").filter(
    (event) => event.participant_id === "gina"
  );
  assert.equal(revivals.length, 1);
  assert.equal(revivals[0].status_source, "Alive");
  assert.equal(revivals[0].by_participant_id, "alice");
  assert.equal(revivals[0].by_role_id, "professor");
});

test("a death reminder without a shroud change creates no death", () => {
  const jumped = { reminder: "Jumped", token_url: "/img/role/fanggu.webp" };
  const { events } = generateEventsForMissingGames([
    page(1, [token("finn", 0, "fang_gu")]),
    page(2, [token("finn", 0, "fang_gu", { reminders: [jumped] })]),
  ]);

  assert.equal(eventsOfType(events, "DEATH").length, 0);
});

test("one player moving several seats is a single seat change", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const before = ids.map((id, order) => token(id, order, "chef"));
  // "a" moves from the first seat to the fourth.
  const after = ["b", "c", "d", "a", "e"].map((id, order) => token(id, order, "chef"));

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  const seatChanges = eventsOfType(events, "SEAT_CHANGE");
  assert.equal(seatChanges.length, 1);
  assert.equal(seatChanges[0].participant_id, "a");
});

test("a seat shuffle that isn't one move keeps every seat change", () => {
  const before = ["a", "b", "c", "d"].map((id, order) => token(id, order, "chef"));
  const after = ["b", "a", "d", "c"].map((id, order) => token(id, order, "chef"));

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(eventsOfType(events, "SEAT_CHANGE").length, 4);
});

test("another character's reminder on a self-reminder character isn't its own", () => {
  // The Preacher's "No Ability" on the Mezepheles: one event, from the
  // Preacher, not a second one for the Mezepheles' own "No Ability".
  const noAbility = { reminder: "No Ability", token_url: "/img/role/preacher.webp" };
  const { events } = generateEventsForMissingGames([
    page(1, [token("lars", 0, "preacher"), token("yasmin", 1, "mezepheles")]),
    page(2, [
      token("lars", 0, "preacher"),
      token("yasmin", 1, "mezepheles", { reminders: [noAbility] }),
    ]),
  ]);

  const removed = events.filter((event) => event.status_source === "No Ability");
  assert.equal(removed.length, 1);
  assert.equal(removed[0].by_role_id, "preacher");
  assert.equal(removed[0].by_participant_id, "lars");
});

test("a Traveller joining and leaving makes no events, also after an exile", () => {
  const emptySeat = () => ({
    ...token("", 3, "beggar"),
    player_name: "",
    role_id: null,
    alignment: "NEUTRAL" as const,
    grimoire_participant_id: null,
    role: null,
  });
  const players = () => [token("ann", 0, "chef"), token("bob", 1, "monk"), token("cid", 2, "chef")];
  const tia = (isDead = false) => ({
    ...token("tia", 3, "beggar", { isDead }),
    role: { name: "Beggar", type: "TRAVELER", initial_alignment: "GOOD" as const },
  });
  const grimoire = [
    [...players(), emptySeat()],
    [...players(), tia()],
    [...players(), tia(true)],
    [...players(), emptySeat()],
  ].map((tokens, index) => ({ id: index + 1, tokens }));

  const { events } = generateEventsForMissingGames(grimoire as any);
  assert.deepEqual(
    events.map((event) => `${event.grimoire_page}:${event.event_type}:${event.player_name}`),
    ["2:NOT_RECORDED:tia"]
  );

  const engine = createGrimoireEventEngine({
    getGrimoire: () => grimoire as any,
    resolveRoleById: () => null,
  });
  assert.deepEqual(
    [...engine.buildExpectations().values()].map(
      (event) => `${event.grimoire_page}:${event.event_type}:${event.player_name}`
    ),
    ["2:NOT_RECORDED:tia"]
  );
});

test("in Musical Chairs the shroud stays with the seat when players move", () => {
  // Lies moves into the Lunatic's seat as it dies, then on to the Mastermind's
  // seat; Mo takes the dead Lunatic seat. The characters stay in their seats.
  const grimoire = () =>
    [
      [token("ann", 0, "chef"), token("lies", 1, "philosopher"), token("dee", 2, "lunatic"), token("mo", 3, "mastermind")],
      [token("ann", 0, "chef"), token("dee", 1, "philosopher"), token("lies", 2, "lunatic", { isDead: true }), token("mo", 3, "mastermind")],
      [token("ann", 0, "chef"), token("dee", 1, "philosopher"), token("mo", 2, "lunatic", { isDead: true }), token("lies", 3, "mastermind")],
    ].map((tokens, index) => ({ id: index + 1, tokens }));
  const lifecycle = (events: { grimoire_page: number; event_type: string | null; participant_id: string }[]) =>
    events
      .filter((event) => ["DEATH", "NOT_RECORDED", "REVIVE"].includes(event.event_type ?? ""))
      .map((event) => `${event.grimoire_page}:${event.event_type}:${event.participant_id}`);

  // Only the seat dying is a death, for whoever sits in it then.
  const server = generateEventsForMissingGames(grimoire() as any, null, { script: "Musical Chairs" });
  assert.deepEqual(lifecycle(server.events), ["1:NOT_RECORDED:lies"]);

  const editorGrimoire = grimoire();
  const engine = createGrimoireEventEngine({
    getGrimoire: () => editorGrimoire as any,
    resolveRoleById: () => null,
    getScript: () => "Musical Chairs",
  });
  assert.deepEqual(lifecycle([...engine.buildExpectations().values()] as any), ["1:NOT_RECORDED:lies"]);

  // Any other script: the shroud belongs to the player (a Matron swap moves
  // the player with their character), so the same pages read as a revive.
  const other = generateEventsForMissingGames(grimoire() as any);
  assert.deepEqual(lifecycle(other.events), ["1:NOT_RECORDED:lies", "2:NOT_RECORDED:mo", "2:REVIVE:lies"]);
});

test("in Musical Chairs an open chair a player left keeps its shroud without a new death", () => {
  const openChair = (order: number, roleId: string, isDead = false) => ({
    ...token("x", order, roleId, { isDead }),
    player_name: "",
    grimoire_participant_id: null,
  });
  const grimoire = [
    [token("ann", 0, "chef"), token("lies", 1, "lunatic"), openChair(2, "mastermind")],
    [token("ann", 0, "chef"), token("lies", 1, "lunatic", { isDead: true }), openChair(2, "mastermind")],
    [token("ann", 0, "chef"), openChair(1, "lunatic", true), token("lies", 2, "mastermind")],
  ].map((tokens, index) => ({ id: index + 1, tokens }));

  const { events } = generateEventsForMissingGames(grimoire as any, null, { script: "Musical Chairs" });
  assert.deepEqual(
    events
      .filter((event) => ["DEATH", "NOT_RECORDED", "REVIVE"].includes(event.event_type ?? ""))
      .map((event) => `${event.grimoire_page}:${event.event_type}:${event.player_name}`),
    ["1:NOT_RECORDED:lies"]
  );
});

test("the editor matches an exile with the shroud's death", () => {
  const engine = createGrimoireEventEngine({ getGrimoire: () => [], resolveRoleById: () => null });
  assert.equal(
    engine.eventReconciliationKind("EXILE" as any, null),
    engine.eventReconciliationKind("NOT_RECORDED" as any, null)
  );
});
