import { GrimoireEventType } from "~/composables/useGames";
import {
  KILLING_DEMON_ROLE_IDS,
  WILDCARD_ROLE_IDS,
} from "~/composables/grimoireRoleGroups";

export type ConditionalRoleInclude = {
  role: string;
  requires: string[];
};

export type RoleIncludeConfig = {
  base: string[];
  conditional: ConditionalRoleInclude[];
};

// Placeholder include lists for event causes.
// Replace with curated role ids later.
export const GRIMOIRE_EVENT_ROLE_INCLUDES: Record<GrimoireEventType, RoleIncludeConfig> = {
  [GrimoireEventType.NOT_RECORDED]: { base: [], conditional: [] },
  [GrimoireEventType.DEATH]: { base: [
    ...WILDCARD_ROLE_IDS,
    ...KILLING_DEMON_ROLE_IDS,
    "acrobat",
    "gambler",
    "gossip",
    "grandmother",
    "lycanthrope",
    "mayor", // Is this correct?
    "slayer",
    "golem",
    "moonchild",
    "tinker",
    "assassin",
    "boomdandy",
    "godfather",
    "harpy",
    "pit-hag", // Extra deaths from demon switch
    "psychopath",
    "witch",
    'harlot',
    'gangster',
    'gnome',
    "angel", // Something bad could be death.
    'doomsayer',
    "hells_librarian", // Something bad could be death.
  ], conditional: [] },
  [GrimoireEventType.EXECUTION]: { base: [
    ...WILDCARD_ROLE_IDS,
    "virgin",
    "mutant",
    "cerenovus",
    "vizier", // Edge case: Could force execution, which is specific player agency.
    "riot", // @todo: Not sure?
    // "scapegoat",
  ], conditional: [] },
  [GrimoireEventType.REVIVE]: { base: [
    ...WILDCARD_ROLE_IDS,
    "professor",
    "al-hadikhia",
    "shabaloth",
    "hindu",
  ], conditional: [] },
  [GrimoireEventType.ROLE_CHANGE]: { base: [
    ...WILDCARD_ROLE_IDS,
    "engineer",
    "farmer",
    "huntsman",
    "snake_charmer",
    "barber",
    "hatter",
    "pit-hag",
    "scarlet_woman",
    "summoner",
    "fang_gu",
    "imp", // Self kill
    "kazali", // Setup?
    "lord_of_typhon", // Setup?
    "cacklejack",
    "hindu",
  ], conditional: [] },
  [GrimoireEventType.ALIGNMENT_CHANGE]: {
    base: [
    ...WILDCARD_ROLE_IDS,
    "bounty_hunter",
    "cult_leader",
    "snake_charmer", // Edge case? Need to test.
    "goon",
    "ogre",
    "politician",
    "mezepheles",
    "summoner", // Edge case? Need to test.
    "fang_gu", // Edge case? Need to test.
    ],
    conditional: [
      { role: 'imp', requires: ['recluse'] }, // Recluse registering as minion catching star pass.
    ],
  },
  [GrimoireEventType.SEAT_CHANGE]: { base: [
    ...WILDCARD_ROLE_IDS,
    "matron",
  ], conditional: [] },
  [GrimoireEventType.MAD]: { base: [
    ...WILDCARD_ROLE_IDS,
    "cerenovus",
    "harpy",
    "pixie",
  ], conditional: [] },
  [GrimoireEventType.DRUNK]: { base: [
    ...WILDCARD_ROLE_IDS,
    "sailor",
    "innkeeper",
    "courtier",
    "philosopher",
    "sweetheart",
    "goon",
    "puzzlemaster",
    "organ_grinder",
    "village_idiot",
  ], conditional: [] },
  [GrimoireEventType.POISONED]: { base: [
    ...WILDCARD_ROLE_IDS,
    "poisoner",
    "widow",
    "pukka",
    "no_dashii",
    "lleech",
    "vigormortis",
    "snake_charmer",
    "cannibal",
  ], conditional: [] },
  [GrimoireEventType.OTHER]: { base: [
    ...WILDCARD_ROLE_IDS,
    "cannibal",
  ], conditional: [] },
};
