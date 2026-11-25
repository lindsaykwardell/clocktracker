import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignParticipantIds,
  matchPageTokens,
} from "../../composables/grimoireParticipantMatching";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";

type Reminder = { reminder: string; token_url: string };

let nextTokenId = 1;

/** A seat without a participant id yet, as old grimoires have them. */
function seat(
  order: number,
  roleId: string | null,
  options: {
    name?: string;
    id?: string;
    isDead?: boolean;
    reminders?: Reminder[];
    alignment?: "GOOD" | "EVIL";
  } = {}
) {
  return {
    id: nextTokenId++,
    order,
    player_name: options.name ?? "",
    player_id: null,
    role_id: roleId,
    related_role_id: null,
    alignment: options.alignment ?? ("GOOD" as const),
    is_dead: options.isDead ?? false,
    grimoire_participant_id: options.id ?? null,
    reminders: options.reminders ?? [],
    role: roleId ? { name: roleId, type: "TOWNSFOLK", initial_alignment: "GOOD" as const } : null,
  };
}

function page(id: number, tokens: ReturnType<typeof seat>[]) {
  return { id, tokens };
}

const poisoned = { reminder: "Poisoned", token_url: "/img/role/nodashii.webp" };

test("a Barber swap of two characters is two character changes, not two seat changes", () => {
  // Sven (seat 3) is the No Dashii; seat 1 is the unnamed Poisoner. They swap characters.
  const before = [seat(0, "poisoner"), seat(1, "chef"), seat(2, "no_dashii", { name: "Sven" })];
  const after = [seat(0, "no_dashii"), seat(1, "chef"), seat(2, "poisoner", { name: "Sven" })];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(events.filter((event) => event.event_type === "SEAT_CHANGE").length, 0);
  const changes = events.filter((event) => event.event_type === "ROLE_CHANGE");
  assert.deepEqual(
    changes.map((event) => [event.old_role_id, event.new_role_id]).sort(),
    [
      ["no_dashii", "poisoner"],
      ["poisoner", "no_dashii"],
    ]
  );
  // Sven keeps his participant across the pages.
  assert.equal(after[2].grimoire_participant_id, before[2].grimoire_participant_id);
});

test("the same swap without any names is still two character changes", () => {
  const before = [seat(0, "poisoner"), seat(1, "chef"), seat(2, "no_dashii")];
  const after = [seat(0, "no_dashii"), seat(1, "chef"), seat(2, "poisoner")];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(events.filter((event) => event.event_type === "SEAT_CHANGE").length, 0);
  assert.equal(events.filter((event) => event.event_type === "ROLE_CHANGE").length, 2);
});

test("a reminder's source in a later seat still gets its participant", () => {
  // The Monk (seat 1) is poisoned by the No Dashii in seat 3.
  const grimoire = [
    page(1, [
      seat(0, "monk", { reminders: [poisoned] }),
      seat(1, "chef"),
      seat(2, "no_dashii", { name: "Sven" }),
    ]),
  ];

  const { events } = generateEventsForMissingGames(grimoire);

  const poisoning = events.find((event) => event.event_type === "POISONED");
  assert.ok(poisoning);
  assert.equal(poisoning.by_role_id, "no_dashii");
  assert.equal(poisoning.by_participant_id, grimoire[0].tokens[2].grimoire_participant_id);
});

test("duplicate seat numbers on a page don't read as seat changes", () => {
  const before = [seat(0, "noble", { name: "Griet" }), seat(1, "chef", { name: "Ann" }), seat(2, "imp", { name: "Bo" })];
  // The same seats, but two tokens stored with order 1 and none with 0.
  const after = [seat(1, "noble", { name: "Griet" }), seat(1, "chef", { name: "Ann" }), seat(2, "imp", { name: "Bo" })];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(events.filter((event) => event.event_type === "SEAT_CHANGE").length, 0);
});

test("a named player who moved is still a seat change", () => {
  const before = [seat(0, "chef", { name: "Ann" }), seat(1, "monk", { name: "Bo" }), seat(2, "imp", { name: "Cy" })];
  const after = [seat(0, "monk", { name: "Bo" }), seat(1, "chef", { name: "Ann" }), seat(2, "imp", { name: "Cy" })];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(events.filter((event) => event.event_type === "SEAT_CHANGE").length, 2);
  assert.equal(events.filter((event) => event.event_type === "ROLE_CHANGE").length, 0);
});

test("a traveller joining shifts the seats without any changes", () => {
  const before = [seat(0, "chef"), seat(1, "monk"), seat(2, "imp")];
  const after = [seat(0, "chef"), seat(1, "beggar"), seat(2, "monk"), seat(3, "imp")];

  const matches = matchPageTokens(before, after);

  assert.equal(matches.get(after[0]), before[0]);
  assert.equal(matches.get(after[1]), undefined);
  assert.equal(matches.get(after[2]), before[1]);
  assert.equal(matches.get(after[3]), before[2]);
});

test("empty seats are never linked by character", () => {
  const before = [seat(0, null), seat(1, null), seat(2, "imp")];
  const after = [seat(0, null), seat(1, "chef"), seat(2, null), seat(3, "imp")];

  const matches = matchPageTokens(before, after);

  assert.equal(matches.get(after[3]), before[2]);
  // Empty seats only pair up by seat: seat 1 with seat 1. Seat 3's own seat
  // went to the Imp, so it's new rather than "the same empty character" as seat 2.
  assert.equal(matches.get(after[0]), before[0]);
  assert.equal(matches.get(after[2]), undefined);
});

test("a name beats a stored participant id, and tokens with different names never link", () => {
  const before = [seat(0, "poisoner", { id: "p-poisoner" }), seat(1, "no_dashii", { name: "Sven", id: "p-sven" })];
  // A bad earlier save gave Sven the Poisoner's id.
  const after = [seat(0, "no_dashii", { id: "p-sven" }), seat(1, "poisoner", { name: "Sven", id: "p-poisoner" })];

  const matches = matchPageTokens(before, after);

  assert.equal(matches.get(after[1]), before[1]);
  assert.equal(matches.get(after[0]), before[0]);
});

test("the editor's assignment follows the matching and never repeats an id on a page", () => {
  const grimoire = [
    page(1, [seat(0, "poisoner", { id: "p-poisoner" }), seat(1, "no_dashii", { name: "Sven", id: "p-sven" })]),
    page(2, [seat(0, "no_dashii", { id: "p-sven" }), seat(1, "poisoner", { name: "Sven", id: "p-poisoner" })]),
  ];

  assignParticipantIds(grimoire, { keepExisting: false });

  const [first, second] = grimoire[1].tokens;
  assert.equal(second.grimoire_participant_id, "p-sven");
  assert.equal(first.grimoire_participant_id, "p-poisoner");
});

test("the fill keeps stored ids and only fills in missing ones", () => {
  const grimoire = [
    page(1, [seat(0, "chef", { id: "keep-me" }), seat(1, "monk")]),
    page(2, [seat(0, "chef", { id: "keep-me" }), seat(1, "monk"), seat(2, "imp", { id: "keep-me" })]),
  ];

  const changed = assignParticipantIds(grimoire, { keepExisting: true });

  assert.equal(grimoire[1].tokens[0].grimoire_participant_id, "keep-me");
  assert.equal(grimoire[1].tokens[1].grimoire_participant_id, grimoire[0].tokens[1].grimoire_participant_id);
  // The duplicate stored id gets a new one rather than two tokens sharing it.
  assert.notEqual(grimoire[1].tokens[2].grimoire_participant_id, "keep-me");
  assert.ok(changed.includes(grimoire[1].tokens[2]));
});

test("Musical Chairs: a player taking over another seat's character changes seat and character", () => {
  // The tokens stay in their seats; Ilian's name moves from the Mutant to the
  // Fortune Teller's seat. Ilian and that seat swap characters.
  const before = [
    seat(0, "mutant", { name: "Ilian" }),
    seat(1, "chef"),
    seat(2, "fortune_teller"),
    seat(3, "imp"),
  ];
  const after = [
    seat(0, "mutant"),
    seat(1, "chef"),
    seat(2, "fortune_teller", { name: "Ilian" }),
    seat(3, "imp"),
  ];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.ok(
    events.some((event) => event.event_type === "SEAT_CHANGE" && event.player_name === "Ilian")
  );
  const ilian = events.find(
    (event) => event.event_type === "ROLE_CHANGE" && event.player_name === "Ilian"
  );
  assert.ok(ilian);
  assert.equal(ilian.old_role_id, "mutant");
  assert.equal(ilian.new_role_id, "fortune_teller");

  // The unnamed seats Ilian left and took are open chairs, not a player who
  // moved the other way: only Ilian's name moved.
  assert.deepEqual(
    events
      .filter((event) => event.event_type === "SEAT_CHANGE" || event.event_type === "ROLE_CHANGE")
      .map((event) => event.player_name),
    ["Ilian", "Ilian"]
  );
});

test("a traveller joining makes no seat changes for the players after them", () => {
  const before = [seat(0, "chef", { name: "Ann" }), seat(1, "monk", { name: "Bo" }), seat(2, "imp", { name: "Cy" })];
  const after = [
    seat(0, "chef", { name: "Ann" }),
    seat(1, "beggar", { name: "Dee" }),
    seat(2, "monk", { name: "Bo" }),
    seat(3, "imp", { name: "Cy" }),
  ];

  const { events } = generateEventsForMissingGames([page(1, before), page(2, after)]);

  assert.equal(events.filter((event) => event.event_type === "SEAT_CHANGE").length, 0);
});
