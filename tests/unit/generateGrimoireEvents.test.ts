import { test } from "node:test";
import assert from "node:assert/strict";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";

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
