import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { REMINDER_RULES } from "../../shared/reminderRules";
import { REMINDER_HINT_ROLE_IDS } from "../../composables/grimoireReminderHints";
import { ROLE_STAT_CARD_DEFINITIONS } from "../../composables/useRoleStatCards";
import { GRIMOIRE_EVENT_ROLE_INCLUDES } from "../../composables/grimoireEventRoleConfig";
import {
  ADDITIONAL_WIN_CONDITION_ROLE_INCLUDES,
  END_TRIGGER_ROLE_INCLUDES,
} from "../../composables/gameEndTriggerConfig";

// The app's role ids come from the role's name (prisma/roles.js nameToId:
// "God of Ug" -> "god_of_ug"), not from the id in roles.json ("godofug").
// Code keyed by a wrong id silently never matches, so every role id used in
// the config must be one the import creates.
const require = createRequire(import.meta.url);
const rawRoles: { name: string }[] = require("../../prisma/roles.json");

function nameToId(name: string) {
  return name.toLowerCase().replace(/ /g, "_").replace(/[()']/g, "");
}

// "Acrobat (Legacy)" is added by prisma/roles.js.
const ROLE_IDS = new Set(
  [...rawRoles.map((role) => role.name), "Acrobat (Legacy)"].map(nameToId)
);

function unknown(ids: Iterable<string>) {
  return [...new Set(ids)].filter((id) => !ROLE_IDS.has(id)).sort();
}

type Includes = { base: string[]; conditional: { role: string; requires: string[] }[] };

function includeIds(config: Includes) {
  return [
    ...config.base,
    ...config.conditional.flatMap((entry) => [entry.role, ...entry.requires]),
  ];
}

/** Every include config nested anywhere in END_TRIGGER_ROLE_INCLUDES. */
function nestedIncludes(value: unknown): Includes[] {
  if (!value || typeof value !== "object") return [];
  if ("base" in value && "conditional" in value) return [value as Includes];
  return Object.values(value).flatMap(nestedIncludes);
}

test("reminder rules use real role ids", () => {
  assert.deepEqual(unknown(REMINDER_RULES.map((rule) => rule.roleId)), []);
});

test("reminder hints use real role ids", () => {
  assert.deepEqual(unknown(REMINDER_HINT_ROLE_IDS), []);
});

test("stat cards use real role ids", () => {
  assert.deepEqual(
    unknown(ROLE_STAT_CARD_DEFINITIONS.flatMap((card) => card.roleIds ?? [])),
    []
  );
});

test("event cause and game end role lists use real role ids", () => {
  const configs = [
    ...Object.values(GRIMOIRE_EVENT_ROLE_INCLUDES),
    ADDITIONAL_WIN_CONDITION_ROLE_INCLUDES,
    ...nestedIncludes(END_TRIGGER_ROLE_INCLUDES),
  ];
  assert.deepEqual(unknown(configs.flatMap(includeIds)), []);
});
