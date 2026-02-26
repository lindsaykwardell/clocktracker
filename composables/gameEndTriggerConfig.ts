import { GameEndTrigger } from "~/composables/useGames";
import {
  KILLING_DEMON_ROLE_IDS,
  WILDCARD_ROLE_IDS,
} from "~/composables/grimoireRoleGroups";

export const END_TRIGGER_ROLE_INCLUDES: Record<
  GameEndTrigger,
  { base: string[]; conditional: { role: string; requires: string[] }[] }
> = {
  [GameEndTrigger.NOT_RECORDED]: { base: [], conditional: [] },
  [GameEndTrigger.CHARACTER_ABILITY]: {
    base: [
    ...WILDCARD_ROLE_IDS,
    // Townsfolk
    'alsaahir',
    'atheist',
    'cult_leader',
    'mayor',

    // Outsider
    'damsel',
    'klutz',
    'saint',

    // Minion
    'evil_twin',
    'fearmonger',
    'goblin',
    'mastermind',

    // Demon
    'leviathan',
    'vortox',

    // Fabled
    'fiddler',
    ],
    conditional: [],
  },
  [GameEndTrigger.NO_LIVING_DEMON]: {
    base: [
    ...WILDCARD_ROLE_IDS,
    ...KILLING_DEMON_ROLE_IDS,

    // Straight up kills/executions
    'slayer',
    'assassin',
    'boomdandy',
    'godfather',
    'psychopath',
    'witch',
    'vizier', // Edge case: Could force execute demon, which is specific player agency.
    'gunslinger',
    'butcher', // Edge case: Could execute demon with extra nomination, which is specific player agency.
    'judge', // Edge case: Could force execute demon, which is specific player agency.
    'gangster',
    'gnome',
    'angel', // Something bad could be death.
    'doomsayer',
    'hells_librarian', // Something bad could be death.
    'big_wig',

    // (Unintended) swaps
    'barber', // Swap demon to dead player?
    'pit-hag', // Could change the demon into non-demon.
    'cacklejack', // Could change the demon into non-demon.

    // Storyteller choice/"yes-but-don't"
    'cerenovus', // Mad demon could be executed.
    'harpy', // // Mad demon could be executed.
    'farmer', // A good demon could be the last demon alive and become the farmer I guess?
    'gossip', // Could kill the demon I guess?
    'harlot',

    ],
    conditional: [
      // Boffin giving demon this character's ability?
      { role: 'acrobat', requires: ['boffin'] },
      { role: 'gambler', requires: ['boffin'] },
      { role: 'grandmother', requires: ['boffin'] },
      { role: 'huntsman', requires: ['boffin'] }, // Not sure, but if the Boffin gives the demon the Damsel's ability and the Huntsman guesses them?
      { role: 'tinker', requires: ['boffin'] },
      { role: 'preacher', requires: ['summoner'] },
      { role: 'sailor', requires: ['summoner'] },
      { role: 'widow', requires: ['summoner'] },
      { role: 'poisoner', requires: ['summoner'] },
    ],
  },
  [GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE]: {
    base: [
    ...WILDCARD_ROLE_IDS,
    ...KILLING_DEMON_ROLE_IDS,
    'mutant', // A Mutant could get themselves executed due to their ability during final 3.
    'boomdandy',
    'cerenovus', // Mad player could be executed during final 3.
    'harpy', // Mad player could be executed during final 3.
    'psychopath', // Could kill during final 3.
    'vizier', // Edge case: Could force execution during final 3, which is specific player agency.
    'gunslinger',
    'butcher', // Edge case: Could cause execute down to 2 with extra nomination, which is specific player agency.
    'judge', // Edge case: Could force execution during final 3, which is specific player agency.
    'gangster', // Could kill during final 3.
    'gnome', // Could kill during final 3.
    'angel', // Something bad could be death.
    'hells_librarian', // Something bad could be death.
    'big_wig',

    // Demons
    'riot',

    // Should these 'extra death at night' abilities be counted?
    // These character could unexpectedly kill down to 2.
    'acrobat', 
    'assassin',
    'gambler',
    'gossip',
    'grandmother',
    'moonchild',
    'godfather',
    'harlot',
    'barista',
    ],
    conditional: [],
  },
  [GameEndTrigger.GAME_ENDED_EARLY]: { base: [], conditional: [] },
  [GameEndTrigger.OTHER]: { base: [], conditional: [] },
};
