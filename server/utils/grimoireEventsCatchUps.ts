import { normalizeRuleReminderName } from "~/shared/reminderRules";

/**
 * The catch-ups for reminder rules added after games already had their
 * events (run by server/utils/grimoireEventsCatchUp.ts).
 *
 * Adding a rule: add a catch-up at the end with the next `version`, listing
 * each official reminder whose events old grimoires may be missing. A new
 * tracking reminder doesn't need one: no old grimoire has it.
 */

export type CatchUpRule = { roleId: string; reminder: string };
export type GrimoireEventsCatchUp = { version: number; added: string; rules: CatchUpRule[] };

export const GRIMOIRE_EVENTS_CATCH_UPS: GrimoireEventsCatchUp[] = [
  {
    version: 1,
    added: "2026-11-23",
    rules: [
      { roleId: "witch", reminder: "Cursed" },
      { roleId: "grandmother", reminder: "Grandchild" },
      { roleId: "evil_twin", reminder: "Twin" },
      { roleId: "ogre", reminder: "Friend" },
      { roleId: "fearmonger", reminder: "Fear" },
      { roleId: "god_of_ug", reminder: "Hat" },
      { roleId: "damsel", reminder: "Guess Used" },
      { roleId: "bounty_hunter", reminder: "Know" },
      { roleId: "bounty_hunter", reminder: "Known" },
      { roleId: "lycanthrope", reminder: "Faux Paw" },
      { roleId: "monk", reminder: "Safe" },
      { roleId: "devils_advocate", reminder: "Survives Execution" },
      { roleId: "po", reminder: "3 Attacks" },
      { roleId: "angel", reminder: "Protected" },
      { roleId: "angel", reminder: "Something Bad" },
      { roleId: "hells_librarian", reminder: "Something Bad" },
      { roleId: "duchess", reminder: "False Info" },
    ],
  },
];

/** What editor saves and the fill store: their events include every rule. */
export const GRIMOIRE_EVENTS_VERSION = Math.max(
  0,
  ...GRIMOIRE_EVENTS_CATCH_UPS.map((catchUp) => catchUp.version)
);

/** The rules of the catch-ups a game at `fromVersion` hasn't had yet. */
export function pendingCatchUpRules(fromVersion: number): CatchUpRule[] {
  return GRIMOIRE_EVENTS_CATCH_UPS.filter((catchUp) => catchUp.version > fromVersion).flatMap(
    (catchUp) => catchUp.rules
  );
}

type EventKeyFields = {
  grimoire_page: number;
  participant_id: string;
  event_type: string;
  status_source: string | null;
  by_role_id: string | null;
};

function eventKey(event: EventKeyFields) {
  return [
    event.grimoire_page,
    event.participant_id,
    event.event_type,
    normalizeRuleReminderName(event.status_source),
    event.by_role_id ?? "",
  ].join("\u0000");
}

/**
 * The generated events that belong to one of the rules and aren't stored yet.
 */
export function catchUpEvents<T extends EventKeyFields>(
  generated: T[],
  existing: EventKeyFields[],
  rules: CatchUpRule[]
): T[] {
  const wanted = new Set(
    rules.map((rule) => `${rule.roleId}\u0000${normalizeRuleReminderName(rule.reminder)}`)
  );
  const stored = new Set(existing.map(eventKey));
  const added = new Set<string>();

  return generated.filter((event) => {
    if (!event.by_role_id || !event.status_source) return false;
    const rule = `${event.by_role_id}\u0000${normalizeRuleReminderName(event.status_source)}`;
    if (!wanted.has(rule)) return false;
    const key = eventKey(event);
    if (stored.has(key) || added.has(key)) return false;
    added.add(key);
    return true;
  });
}
