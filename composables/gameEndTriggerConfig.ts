import {
  type GameEndTrigger,
  type GameEndTriggerCause,
  type GameEndTriggerType,
} from "~/composables/useGames";
import {
  KILLING_DEMON_ROLE_IDS,
  WILDCARD_ROLE_IDS,
} from "~/composables/grimoireRoleGroups";

export type EndTriggerRoleIncludeConfig = {
  base: string[];
  conditional: { role: string; requires: string[] }[];
};

export const ADDITIONAL_WIN_CONDITION_ROLE_INCLUDES: EndTriggerRoleIncludeConfig =
  {
    base: [
      ...WILDCARD_ROLE_IDS,
      // Townsfolk
      "alsaahir", // Used their ability
      "atheist", // Storyteller executed.
      "cult_leader", // Ability used
      "mayor", // Ability triggered

      // Outsider
      "damsel", // Guessed by minion
      "klutz", // Wrong choice with ability
      "saint", // Executed

      // Minion
      "evil_twin", // Wrong twin executed.
      "fearmonger", // Executed their target
      "goblin", // Executed when claimed
      "mastermind", // No

      // Demon
      "leviathan", // Two endings
      "vortox", // Nobody executed

      // Fabled
      "fiddler", // Ability used
    ],
    conditional: [],
  };

export const END_TRIGGER_ROLE_INCLUDES: Partial<
  Record<
    GameEndTrigger,
    Partial<
      Record<
        GameEndTriggerType,
        Partial<Record<GameEndTriggerCause, EndTriggerRoleIncludeConfig>>
      >
    >
  >
> = {
  NO_LIVING_DEMON: {
    DEATH: {
      ABILITY: {
        base: [
          ...WILDCARD_ROLE_IDS,
          ...KILLING_DEMON_ROLE_IDS,
          // Straight-up kills/deaths
          "slayer",
          "assassin",
          "godfather",
          "psychopath",
          "witch",
          "gunslinger",
          "gangster",
          "gnome",
          
          // Storyteller choice/"yes-but-don't"
          // "boomdandy", // Game would be over
          "angel", // Something bad could be death.
          "hells_librarian", // Something bad could be death.
          "big_wig",
          "doomsayer",
        ],
        conditional: [
          // Boffin giving demon this character's ability?
          { role: "acrobat", requires: ["boffin"] }, // Picks drunk/poisoned character
          { role: "gambler", requires: ["boffin"] }, // Gambles wrong
          { role: "grandmother", requires: ["boffin"] }, // Dies with grandchild
          { role: "huntsman", requires: ["boffin"] }, // Not sure, but if the Boffin gives the demon the Damsel's ability and the Huntsman guesses them?
          { role: "tinker", requires: ["boffin"] }, // Die at any time
        ],
      },
    },
    EXECUTION: {
      ABILITY: {
        base: [
          ...WILDCARD_ROLE_IDS,
          "butcher", // Edge case: Could execute demon with extra nomination, which is specific player agency.
          "judge", // Edge case: Could force execute demon, which is specific player agency.
          "vizier", // Edge case: Could force execute demon, which is specific player agency.

          // Storyteller choice/"yes-but-don't"
          "cerenovus", // Mad demon could be executed.
          "harpy", // // Mad demon could be executed.
        ],
        conditional: [],
      },
    },
    CHARACTER_CHANGE: {
      ABILITY: {
        base: [
          ...WILDCARD_ROLE_IDS,

          // (Unintended) swaps
          "barber", // Swap demon to dead player?
          "pit-hag", // Could change the demon into non-demon.
          
          // Storyteller choice/"yes-but-don't"
          "cacklejack", // Could change the demon into non-demon.
          "farmer", // A good demon could be the last demon alive and become the farmer I guess?
        ],
        conditional: [],
      },
    },
    OTHER: {
      FAILED_ABILITY: {
        base: [],
        conditional: [
          // Prevent summoning on day 3.
          { role: "preacher", requires: ["summoner"] },
          { role: "sailor", requires: ["summoner"] },
          { role: "widow", requires: ["summoner"] },
          { role: "poisoner", requires: ["summoner"] },
        ],
      },
      ABILITY: {
        base: [],
        conditional: [],
      },
    },
  },
  TWO_PLAYERS_LEFT_ALIVE: {
    DEATH: {
      ABILITY: {
        base: [
          ...WILDCARD_ROLE_IDS,
          ...KILLING_DEMON_ROLE_IDS,
          // Straight-up kills/deaths
          // "riot", // Nominee "dies" (not "is executed")
          "psychopath", // Could kill during final 3.
          "gnome", // Could kill during final 3.
          "gangster", // Could kill during final 3.
          "gunslinger", // Could kill during final 3.
          
          // Storyteller choice/"yes-but-don't"
          // "boomdandy", // Invalid cause "Game would be over"
          "angel", // Something bad could be death during final 3.
          "hells_librarian", // Something bad could be death during final 3.
          "big_wig", // Could die during final 3.

          // Should these 'extra death at night' abilities be counted?
          // These character could unexpectedly kill down to 2.
          "acrobat",
          "gambler",
          "gossip",
          "grandmother",
          "moonchild",
          "assassin",
          "godfather",
          "harlot",
          "barista",
        ],
        conditional: [],
      },
    },
    EXECUTION: {
      ABILITY: {
        base: [
          ...WILDCARD_ROLE_IDS,
          "mutant", // A Mutant could get themselves executed due to their ability during final 3.
          "cerenovus", // Mad player could be executed during final 3.
          "harpy", // Mad player could be executed during final 3.

          // Edge cases
          "vizier", // Could force execution during final 3, which is specific player agency.
          "butcher", // Could cause execute down to 2 with extra nomination, which is specific player agency.
          "judge", // Could force execution during final 3, which is specific player agency.
        ],
        conditional: [],
      },
    },
    CHARACTER_CHANGE: {
      ABILITY: {
        base: [],
        conditional: [],
      },
    },
  },
};
