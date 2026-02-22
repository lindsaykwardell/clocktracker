import { DeathType } from "~/composables/useGames";

// These could become anything..
export const WILDCARDS: string[] = [
  'amnesiac',
  'cannibal',
  'philosopher',
  'pixie',
  'hermit',
  'wizard',
  'plague_doctor',
  'apprentice',
  'bootlegger',
];

// Demons that kill or cause kills, including themselves.
export const DEMONS_THAT_KILL: string[] = [
  'al-hadikhia',
  'fang_gu',
  'imp',
  'kazali',
  'legion',
  'lil_monsta',
  'lleech',
  'lord_of_typhon',
  'no_dashii',
  'ojo',
  'po',
  'pukka',
  'shabaloth',
  'vigormortis',
  'vortox',
  'yaggababble',
  'zombuul',
];

// Placeholder include lists for death/execution causes.
// Replace with curated role ids later.
export const DEATH_ROLE_INCLUDES: Record<DeathType, string[]> = {
  [DeathType.DEATH]: [
    ...DEMONS_THAT_KILL,
    "acrobat",
    "alchemist",
    "atheist",
    "gambler",
    "gossip",
    "grandmother",
    "lycanthrope",
    "mayor",
    "slayer",
    "golem",
    "moonchild",
    "tinker",
    "assassin",
    "boomdandy",
    "godfather",
    "harpy",
    "pithag", // Extra deaths from demon switch
    "psychopath",
    "witch",
    'hells_librarian', // Something bad could be death.
  ],
  [DeathType.EXECUTION]: [
    "virgin",
    "mutant",
    "banshee", // Edge case?
    "cerenovus",
    "vizier", // Edge case: Could force execution, which is specific player agency.
    "riot", // Not sure?
  ],
  [DeathType.REVIVE]: [
    "professor",
    "al-hadikhia",
    "shabaloth",
  ],
};
