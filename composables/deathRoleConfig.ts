import { DeathType } from "~/composables/useGames";

// Placeholder include lists for death/execution causes.
// Replace with curated role ids later.
export const DEATH_ROLE_INCLUDES: Record<DeathType, string[]> = {
  [DeathType.DEATH]: [
    "slayer",
    "assassin",
    "godfather",
    "psychopath",
    "gossip",
    "gambler",
    "tinker",
    "shabaloth",
  ],
  [DeathType.EXECUTION]: [
    "mutant",
    "cerenovus",
    "harpy",
    "judge",
    "vizier",
  ],
};
