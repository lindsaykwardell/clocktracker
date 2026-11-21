import { test } from "node:test";
import assert from "node:assert/strict";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";
import { createGrimoireEventEngine } from "../../composables/grimoireEventEngine";
import { buildReminderCatalog } from "../../shared/reminderCatalog";

// Both event engines read a reminder's role from the reminder catalog when
// they have one, instead of guessing it from the role names in its icon.

const ROLES = {
  librarian: { name: "Librarian", type: "TOWNSFOLK", alignment: "GOOD" },
  hells_librarian: { name: "Hell's Librarian", type: "FABLED", alignment: "NEUTRAL" },
  imp: { name: "Imp", type: "DEMON", alignment: "EVIL" },
  chef: { name: "Chef", type: "TOWNSFOLK", alignment: "GOOD" },
  poisoner: { name: "Poisoner", type: "MINION", alignment: "EVIL" },
} as const;
type RoleId = keyof typeof ROLES;

const catalog = buildReminderCatalog([
  { id: "librarian", token_url: "/img/role/librarian.webp", reminders: [{ id: 1, reminder: "Outsider" }] },
  {
    id: "hells_librarian",
    token_url: "/img/role/hellslibrarian.webp",
    reminders: [{ id: 2, reminder: "Dead" }],
  },
  { id: "imp", token_url: "/img/role/imp.webp", reminders: [{ id: 3, reminder: "Dead" }] },
  { id: "chef", token_url: "/img/role/chef.webp", reminders: [] },
  { id: "poisoner", token_url: "/img/role/poisoner.webp", reminders: [{ id: 4, reminder: "Poisoned" }] },
]);

let nextTokenId = 1;
function seat(
  id: string,
  order: number,
  role: RoleId,
  options: { dead?: boolean; reminders?: { reminder: string; token_url: string; role_reminder_id?: number | null }[] } = {}
) {
  return {
    id: nextTokenId++,
    order,
    player_name: id,
    player_id: null,
    role_id: role,
    related_role_id: null,
    alignment: (ROLES[role].alignment === "EVIL" ? "EVIL" : "GOOD") as "GOOD" | "EVIL",
    is_dead: options.dead ?? false,
    grimoire_participant_id: id,
    reminders: options.reminders ?? [],
    role: {
      name: ROLES[role].name,
      type: ROLES[role].type,
      initial_alignment: ROLES[role].alignment,
      token_url: `/img/role/${role.replace(/_/g, "")}.webp`,
    },
  };
}

/** The Hell's Librarian (a Fabled, not in a seat) kills the Librarian. */
function hellsLibrarianKillsLibrarian() {
  const dead = {
    reminder: "Dead",
    token_url: "/img/role/hellslibrarian.webp",
    role_reminder_id: 2,
  };
  return [
    { id: 1, tokens: [seat("lia", 0, "librarian"), seat("ivo", 1, "imp"), seat("cal", 2, "chef")] },
    {
      id: 2,
      tokens: [
        seat("lia", 0, "librarian", { dead: true, reminders: [dead] }),
        seat("ivo", 1, "imp"),
        seat("cal", 2, "chef"),
      ],
    },
  ];
}

test("the server credits the Hell's Librarian's Dead to the Hell's Librarian, not the Librarian", () => {
  const { events } = generateEventsForMissingGames(hellsLibrarianKillsLibrarian() as any, catalog);
  const deaths = events.filter((event) => event.participant_id === "lia");
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].event_type, "DEATH");
  assert.equal(deaths[0].by_role_id, "hells_librarian");
  assert.equal(deaths[0].by_participant_id, null);
});

test("the editor credits the Hell's Librarian's Dead to the Hell's Librarian, not the Librarian", () => {
  const grimoire = hellsLibrarianKillsLibrarian();
  const engine = createGrimoireEventEngine({
    getGrimoire: () => grimoire as any,
    resolveRoleById: (id) => (id && id in ROLES ? ROLES[id as RoleId] : null),
    getCatalog: () => catalog,
  });
  const deaths = [...engine.buildExpectations().values()].filter(
    (event) => event.participant_id === "lia"
  );
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].event_type, "DEATH");
  assert.equal(deaths[0].by_role_id, "hells_librarian");
  assert.equal(deaths[0].by_participant_id, null);
});

/**
 * The Poisoner poisons the Chef on Night 1 and again on Night 2. The Day and
 * Night 2 pages were made by "Add page" with the lifetimes applied when
 * `marked`, so the Poisoned on Night 2 was placed again.
 */
function poisonerTwice(marked: boolean) {
  const poisoned = () => ({
    reminder: "Poisoned",
    token_url: "/img/role/poisoner.webp",
    role_reminder_id: 4,
  });
  const page = (id: number, page_type: string, chefReminders: ReturnType<typeof poisoned>[]) => ({
    id,
    page_type,
    lifetimes_applied: marked && id > 1,
    tokens: [
      seat("pia", 0, "poisoner"),
      seat("cal", 1, "chef", { reminders: chefReminders }),
      seat("ivo", 2, "imp"),
    ],
  });
  return [
    page(1, "NIGHT", [poisoned()]),
    page(2, "DAY", [poisoned()]),
    page(3, "NIGHT", [poisoned()]),
  ];
}

function poisonings(events: { participant_id: string; event_type: string | null }[]) {
  return events.filter((event) => event.participant_id === "cal" && event.event_type === "POISONED");
}

test("a reminder placed again on a page with the lifetimes applied counts again", () => {
  const server = generateEventsForMissingGames(poisonerTwice(true) as any, catalog).events;
  assert.equal(poisonings(server).length, 2);

  const grimoire = poisonerTwice(true);
  const engine = createGrimoireEventEngine({
    getGrimoire: () => grimoire as any,
    resolveRoleById: (id) => (id && id in ROLES ? ROLES[id as RoleId] : null),
    getCatalog: () => catalog,
  });
  const editor = [...engine.buildExpectations().values()];
  assert.equal(poisonings(editor).length, 2);
  assert.deepEqual(
    poisonings(editor).map((event: any) => event.grimoire_page),
    [0, 2]
  );
});

test("without the marker a carried-over reminder counts once, as before", () => {
  const server = generateEventsForMissingGames(poisonerTwice(false) as any, catalog).events;
  assert.equal(poisonings(server).length, 1);

  const grimoire = poisonerTwice(false);
  const engine = createGrimoireEventEngine({
    getGrimoire: () => grimoire as any,
    resolveRoleById: (id) => (id && id in ROLES ? ROLES[id as RoleId] : null),
    getCatalog: () => catalog,
  });
  assert.equal(poisonings([...engine.buildExpectations().values()]).length, 1);
});
