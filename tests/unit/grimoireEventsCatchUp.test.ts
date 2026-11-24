import { test } from "node:test";
import assert from "node:assert/strict";
import { generateEventsForMissingGames } from "../../server/utils/generateGrimoireEvents";
import {
  GRIMOIRE_EVENTS_CATCH_UPS,
  GRIMOIRE_EVENTS_VERSION,
  catchUpEvents,
  pendingCatchUpRules,
} from "../../server/utils/grimoireEventsCatchUps";
import { REMINDER_RULES } from "../../shared/reminderRules";

function event(
  grimoire_page: number,
  participant_id: string,
  status_source: string | null,
  by_role_id: string | null,
  event_type = "OTHER"
) {
  return { grimoire_page, participant_id, event_type, status_source, by_role_id };
}

const WITCH = [{ roleId: "witch", reminder: "Cursed" }];

test("only the listed rules' events are added", () => {
  const generated = [
    event(1, "a", "Cursed", "witch"),
    event(1, "b", "Poisoned", "poisoner", "POISONED"),
    event(2, "c", null, null, "DEATH"),
  ];
  assert.deepEqual(catchUpEvents(generated, [], WITCH), [generated[0]]);
});

test("an event already stored isn't added again", () => {
  const generated = [event(1, "a", "Cursed", "witch"), event(3, "a", "Cursed", "witch")];
  const existing = [event(1, "a", "Cursed", "witch"), event(1, "b", "Poisoned", "poisoner")];
  assert.deepEqual(catchUpEvents(generated, existing, WITCH), [generated[1]]);
});

test("the reminder wording is compared like the rules compare it", () => {
  const generated = [event(1, "a", "cursed ", "witch")];
  assert.equal(catchUpEvents(generated, [], WITCH).length, 1);
  assert.equal(catchUpEvents(generated, [event(1, "a", "Cursed", "witch")], WITCH).length, 0);
});

test("the same reminder of another role doesn't count", () => {
  const generated = [
    event(1, "a", "Something Bad", "angel"),
    event(1, "b", "Something Bad", "hells_librarian"),
  ];
  const rules = [{ roleId: "angel", reminder: "Something Bad" }];
  assert.deepEqual(catchUpEvents(generated, [], rules), [generated[0]]);
});

test("a game only gets the catch-ups it hasn't had", () => {
  assert.ok(pendingCatchUpRules(0).length > 0);
  assert.deepEqual(pendingCatchUpRules(GRIMOIRE_EVENTS_VERSION), []);
});

test("catch-up versions count up from 1 and every rule exists", () => {
  GRIMOIRE_EVENTS_CATCH_UPS.forEach((catchUp, index) => {
    assert.equal(catchUp.version, index + 1);
  });
  const known = new Set(REMINDER_RULES.map((rule) => `${rule.roleId}|${rule.reminder}`));
  const missing = GRIMOIRE_EVENTS_CATCH_UPS.flatMap((catchUp) => catchUp.rules)
    .map((rule) => `${rule.roleId}|${rule.reminder}`)
    .filter((key) => !known.has(key));
  assert.deepEqual(missing, []);
});

test("an old grimoire gets the new rule's events next to the ones it had", () => {
  const reminder = (roleId: string, text: string) => ({
    reminder: text,
    token_url: `/img/role/${roleId.replace(/_/g, "")}.webp`,
  });
  let tokenId = 1;
  const seat = (id: string, role_id: string, reminders: ReturnType<typeof reminder>[] = []) => ({
    id: tokenId++,
    order: tokenId,
    player_name: id,
    player_id: null,
    role_id,
    related_role_id: null,
    alignment: "GOOD",
    is_dead: false,
    grimoire_participant_id: id,
    reminders,
    role: null,
  });
  const pages = [
    { id: 1, tokens: [seat("w", "witch"), seat("a", "chef", [reminder("witch", "Cursed")])] },
    { id: 2, tokens: [seat("w", "witch"), seat("a", "chef", [reminder("witch", "Cursed")])] },
    { id: 3, tokens: [seat("w", "witch"), seat("a", "chef"), seat("b", "empath", [reminder("witch", "Cursed")])] },
  ];
  const generated = generateEventsForMissingGames(pages as any).events;
  // Stored before the rule existed: none of the Witch's events.
  const stored = generated.filter((e) => e.by_role_id !== "witch");

  const added = catchUpEvents(generated, stored, pendingCatchUpRules(0));
  assert.deepEqual(
    added.map((e) => `${e.grimoire_page}:${e.participant_id}:${e.status_source}`),
    ["0:a:Cursed", "2:b:Cursed"]
  );
});
