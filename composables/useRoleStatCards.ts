import type { GameRecord } from "~/composables/useGames";
import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  GrimoireEventType,
} from "~/composables/useGames";

export type RoleStatCardCategory = "role" | "general";

export type RoleStatCardRecord = {
  id: number;
  role_id: string | null;
  source: string;
  metric_key: string;
  storyteller_only: boolean;
  role?: {
    id: string;
    name: string;
    ability: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  } | null;
};

export type RoleStatCardDisplayRole = {
  id: string;
  name: string;
  token_url: string;
  type: string;
  initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
};

export type RoleStatCardResult = {
  count: number;
  metricLabel: string;
  sentence: string;
  subtitle?: string | null;
  displayRole?: RoleStatCardDisplayRole | null;
};

type RoleStatCardContext = {
  games: GameRecord[];
  roleId?: string | null;
  roleName?: string | null;
  isMe?: boolean;
  username?: string;
};

export type RoleStatCardDefinition = {
  id: string;
  category: RoleStatCardCategory;
  roleIds?: string[];
  source: string;
  label: string;
  getCount: (context: RoleStatCardContext) => number;
  getSentence: (context: Required<Pick<RoleStatCardContext, "games">> & {
    count: number;
    roleId?: string | null;
    roleName?: string | null;
    isMe: boolean;
  }) => string;
  getSubtitle?: (context: RoleStatCardContext & { count: number }) => string | null;
  getDisplayRole?: (context: RoleStatCardContext & { count: number }) => RoleStatCardDisplayRole | null;
};

export const ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "pit_hag_role_changes",
    category: "role",
    roleIds: ["pit_hag"],
    source: "grimoire_event",
    label: "Cauldron's Work",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Pit-Hag, ${subject(isMe)} changed ${count} player${pluralize(count)} into a different character.`,
  },
  {
    id: "pit_hag_good_demons_created",
    category: "role",
    roleIds: ["pit_hag"],
    source: "grimoire_event",
    label: "Monstrous Creations",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            return (
              currentToken?.role?.type === "DEMON" &&
              currentToken.alignment === "GOOD"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Pit-Hag, ${subject(isMe)} created ${count} good demon${pluralize(count)}.`,
  },
  {
    id: "pit_hag_accidental_game_endings",
    category: "role",
    roleIds: ["pit_hag"],
    source: "end_trigger",
    label: "Cauldron Catastrophe",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_type === GameEndTriggerType.CHARACTER_CHANGE &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      `As the Pit-Hag, ${subject(isMe)} ended the game ${count} time${pluralize(count)} by removing the last living demon.`,
  },
  {
    id: "pit_hag_demon_to_demon_changes",
    category: "role",
    roleIds: ["pit_hag"],
    source: "grimoire_event",
    label: "Demon Decanted",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              previousToken?.role?.type === "DEMON" &&
              currentToken?.role?.type === "DEMON" &&
              previousToken.role_id !== currentToken.role_id
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Pit-Hag, ${subject(isMe)} turned the demon into another demon ${count} time${pluralize(count)}.`,
  },
  {
    id: "pit_hag_self_changes",
    category: "role",
    roleIds: ["pit_hag"],
    source: "grimoire_event",
    label: "Self-Transformation",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === roleId ||
              previousToken?.role_id === roleId
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Pit-Hag, ${subject(isMe)} changed yourself ${count} time${pluralize(count)}.`,
  },
  {
    id: "psychopath_kills",
    category: "role",
    roleIds: ["psychopath"],
    source: "grimoire_event",
    label: "Here's Johnny!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Psychopath, ${subject(isMe)} axed ${count} player${pluralize(count)} in broad daylight.`,
  },
  {
    id: "witch_kills",
    category: "role",
    roleIds: ["witch"],
    source: "grimoire_event",
    label: "Curses!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Witch, ${subject(isMe)} cursed ${count} player${pluralize(count)} to die for nominating.`,
  },
  {
    id: "harlot_mutual_deaths",
    category: "role",
    roleIds: ["harlot"],
    source: "grimoire_event",
    label: "Dangerous Liaison",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Harlot, ${subject(isMe)} died alongside another player ${count} time${pluralize(count)}.`,
  },
  {
    id: "gangster_kills",
    category: "role",
    roleIds: ["gangster"],
    source: "grimoire_event",
    label: "Contract Killing",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Gangster, ${subject(isMe)} arranged ${count} hit${pluralize(count)} on your neighbors.`,
  },
  {
    id: "engineer_uses",
    category: "role",
    roleIds: ["engineer"],
    source: "grimoire_event",
    label: "Patch Job",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let total = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const pages = new Set<number>();

        for (const event of game.grimoire_events) {
          if (
            event.by_role_id === roleId &&
            event.event_type === GrimoireEventType.ROLE_CHANGE
          ) {
            pages.add(event.grimoire_page);
          }
        }

        total += pages.size;
      }

      return total;
    },
    getSentence: ({ count, isMe }) =>
      `As the Engineer, ${subject(isMe)} reassembled ${count} evil team${pluralize(count)} with your ability.`,
  },
  {
    id: "farmer_role_changes",
    category: "role",
    roleIds: ["farmer"],
    source: "grimoire_event",
    label: "Passing The Plough",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Farmer, ${subject(isMe)} died and created another Farmer ${count} time${pluralize(count)}.`,
  },
  {
    id: "huntsman_damsel_saves",
    category: "role",
    roleIds: ["huntsman"],
    source: "grimoire_event",
    label: "Just In Time",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Huntsman, ${subject(isMe)} saved the Damsel ${count} time${pluralize(count)}.`,
  },
  {
    id: "snake_charmer_demon_charms",
    category: "role",
    roleIds: ["snake_charmer"],
    source: "grimoire_event",
    label: "Charmed, I'm Sure",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const previousToken = getEventPreviousToken(game, event);
            const currentToken = getEventCurrentToken(game, event);

            return (
              previousToken?.role?.type === "DEMON" &&
              currentToken?.role_id === roleId
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Snake Charmer, ${subject(isMe)} successfully charmed the demon ${count} time${pluralize(count)}.`,
  },
  {
    id: "snake_charmer_post_charm_win_rate",
    category: "role",
    roleIds: ["snake_charmer"],
    source: "grimoire_event",
    label: "Calculated Risk",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      const charmedGames = games.filter((game) => {
        if (game.ignore_for_stats) return false;

        return game.grimoire_events.some((event) => {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.ROLE_CHANGE
          ) {
            return false;
          }

          const previousToken = getEventPreviousToken(game, event);
          const currentToken = getEventCurrentToken(game, event);

          return (
            previousToken?.role?.type === "DEMON" &&
            currentToken?.role_id === roleId
          );
        });
      });

      if (!charmedGames.length) return 0;

      // After a successful charm, the Snake Charmer usually becomes the demon and
      // therefore wants EVIL_WINS. This intentionally ignores rare edge cases like
      // a good demon being charmed, because the normal evil-demon case is by far
      // the most common interpretation of this stat.
      const wins = charmedGames.filter((game) => game.win_v2 === "EVIL_WINS").length;
      return Math.round((wins / charmedGames.length) * 100);
    },
    getSentence: ({ count }) =>
      `After charming the demon, you've gone on to win ${count}% of those games.`,
  },
  {
    id: "barber_role_swaps",
    category: "role",
    roleIds: ["barber"],
    source: "grimoire_event",
    label: "Shear Chaos",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Barber, ${subject(isMe)} caused ${count} player${pluralize(count)} to swap characters when you died.`,
  },
  {
    id: "hatter_role_changes",
    category: "role",
    roleIds: ["hatter"],
    source: "grimoire_event",
    label: "Tea Party Tonight",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Hatter, ${subject(isMe)} caused ${count} evil character change${pluralize(count)} when you died.`,
  },
  {
    id: "scarlet_woman_demon_changes",
    category: "role",
    roleIds: ["scarlet_woman"],
    source: "grimoire_event",
    label: "The New Master",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Scarlet Woman, ${subject(isMe)} inherited the demon's mantle ${count} time${pluralize(count)}.`,
  },
  {
    id: "summoner_demon_changes",
    category: "role",
    roleIds: ["summoner"],
    source: "grimoire_event",
    label: "The Ritual Complete",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Summoner, ${subject(isMe)} successfully summoned a demon ${count} time${pluralize(count)}.`,
  },
  {
    id: "fang_gu_outsider_possessions",
    category: "role",
    roleIds: ["fang_gu"],
    source: "grimoire_event",
    label: "Possession",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const previousToken = getEventPreviousToken(game, event);
            const currentToken = getEventCurrentToken(game, event);

            return (
              previousToken?.role?.type === "OUTSIDER" &&
              currentToken?.role_id === roleId &&
              currentToken.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Fang Gu, ${subject(isMe)} possessed an Outsider ${count} time${pluralize(count)}.`,
  },
  {
    id: "imp_starpasses",
    category: "role",
    roleIds: ["imp"],
    source: "grimoire_event",
    label: "The Starpass",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const previousToken = getEventPreviousToken(game, event);
            const currentToken = getEventCurrentToken(game, event);

            return (
              previousToken?.role_id === roleId &&
              currentToken?.alignment === "EVIL" &&
              currentToken?.role?.type === "MINION"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Imp, ${subject(isMe)} passed your star to a Minion ${count} time${pluralize(count)}.`,
  },
  {
    id: "kazali_minion_changes",
    category: "role",
    roleIds: ["kazali"],
    source: "grimoire_event",
    label: "Set Up To Win",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            return currentToken?.role?.type === "MINION";
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Kazali, ${subject(isMe)} turned ${count} player${pluralize(count)} into Minions.`,
  },
  {
    id: "virgin_executions",
    category: "role",
    roleIds: ["virgin"],
    source: "grimoire_event",
    label: "Unblemished",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      `As the Virgin, ${subject(isMe)} caused ${count} immediate execution${pluralize(count)} by being nominated.`,
  },
  {
    id: "virgin_spy_executions",
    category: "role",
    roleIds: ["virgin"],
    source: "grimoire_event",
    label: "False Witness",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.EXECUTION
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === "spy" ||
              previousToken?.role_id === "spy"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Virgin, ${subject(isMe)} caused the Spy to be executed ${count} time${pluralize(count)}.`,
  },
  {
    id: "mutant_executions",
    category: "role",
    roleIds: ["mutant"],
    source: "grimoire_event",
    label: "Slip of the Tongue",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      `As the Mutant, ${subject(isMe)} been executed ${count} time${pluralize(count)} for revealing yourself.`,
  },
  {
    id: "cerenovus_executions",
    category: "role",
    roleIds: ["cerenovus"],
    source: "grimoire_event",
    label: "Reality Override",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      `As the Cerenovus, ${subject(isMe)} caused ${count} execution${pluralize(count)} through your madness.`,
  },
  {
    id: "vizier_forced_executions",
    category: "role",
    roleIds: ["vizier"],
    source: "grimoire_event",
    label: "Judge, Jury, Executioner",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      `As the Vizier, ${subject(isMe)} forced ${count} execution${pluralize(count)}.`,
  },
  {
    id: "shabaloth_revives",
    category: "role",
    roleIds: ["shabaloth"],
    source: "grimoire_event",
    label: "Returned From The Maw",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      `As the Shabaloth, ${subject(isMe)} regurgitated ${count} player${pluralize(count)} back to life.`,
  },
  {
    id: "gnome_kills",
    category: "role",
    roleIds: ["gnome"],
    source: "grimoire_event",
    label: "Hands Off My Amigo",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Gnome, ${subject(isMe)} killed ${count} player${pluralize(count)} for nominating your amigo.`,
  },
  {
    id: "professor_revives",
    category: "role",
    roleIds: ["professor"],
    source: "grimoire_event",
    label: "It's Alive!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      `As the Professor, ${subject(isMe)} brought ${count} Townsfolk back to life.`,
  },
  {
    id: "slayer_kills",
    category: "role",
    roleIds: ["slayer"],
    source: "grimoire_event",
    label: "Bullseye",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Slayer, ${subject(isMe)} killed ${count} player${pluralize(count)} with your shot.`,
  },
  {
    id: "slayer_game_ending_kills",
    category: "role",
    roleIds: ["slayer"],
    source: "end_trigger",
    label: "Finishing Shot",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      `As the Slayer, ${subject(isMe)} ended the game with your shot ${count} time${pluralize(count)}.`,
  },
  {
    id: "slayer_recluse_kills",
    category: "role",
    roleIds: ["slayer"],
    source: "grimoire_event",
    label: "Collateral Damage",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === "recluse" ||
              previousToken?.role_id === "recluse"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Slayer, ${subject(isMe)} killed the Recluse ${count} time${pluralize(count)}.`,
  },
  {
    id: "acrobat_self_deaths",
    category: "role",
    roleIds: ["acrobat"],
    source: "grimoire_event",
    label: "Fatal Stunts",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Acrobat, ${subject(isMe)} died ${count} time${pluralize(count)} by picking a drunk/poisoned player.`,
  },
  {
    id: "gambler_self_deaths",
    category: "role",
    roleIds: ["gambler"],
    source: "grimoire_event",
    label: "Came Up Tails",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Gambler, ${subject(isMe)} died ${count} time${pluralize(count)} by guessing a character wrong.`,
  },
  {
    id: "gossip_kills",
    category: "role",
    roleIds: ["gossip"],
    source: "grimoire_event",
    label: "Loose Lips",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Gossip, ${subject(isMe)} made ${count} statement${pluralize(count)} that proved deadly.`,
  },
  {
    id: "grandmother_self_deaths",
    category: "role",
    roleIds: ["grandmother"],
    source: "grimoire_event",
    label: "Shared Fate",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Grandmother, ${subject(isMe)} died ${count} time${pluralize(count)} when your grandchild died.`,
  },
  {
    id: "lycanthrope_good_kills",
    category: "role",
    roleIds: ["lycanthrope"],
    source: "grimoire_event",
    label: "Howling Madness",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.alignment === "GOOD" ||
              previousToken?.alignment === "GOOD"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Lycanthrope, ${subject(isMe)} mauled ${count} good player${pluralize(count)}.`,
  },
  {
    id: "lycanthrope_spy_kills",
    category: "role",
    roleIds: ["lycanthrope"],
    source: "grimoire_event",
    label: "Misregistration by Moonlight",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === "spy" ||
              previousToken?.role_id === "spy"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Lycanthrope, ${subject(isMe)} torn into the Spy ${count} time${pluralize(count)}.`,
  },
  {
    id: "golem_kills",
    category: "role",
    roleIds: ["golem"],
    source: "grimoire_event",
    label: "Golem Smash",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Golem, ${subject(isMe)} killed ${count} player${pluralize(count)} with your nomination.`,
  },
  {
    id: "golem_evil_kills",
    category: "role",
    roleIds: ["golem"],
    source: "grimoire_event",
    label: "Crushing Evil",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.alignment === "EVIL" ||
              previousToken?.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Golem, ${subject(isMe)} crushed ${count} evil player${pluralize(count)} with your nomination.`,
  },
  {
    id: "moonchild_kills",
    category: "role",
    roleIds: ["moonchild"],
    source: "grimoire_event",
    label: "Star-Crossed",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Moonchild, ${subject(isMe)} doomed ${count} player${pluralize(count)} with your choice.`,
  },
  {
    id: "moonchild_spy_kills",
    category: "role",
    roleIds: ["moonchild"],
    source: "grimoire_event",
    label: "A Crooked Constellation",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === "spy" ||
              previousToken?.role_id === "spy"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Moonchild, ${subject(isMe)} doomed the Spy ${count} time${pluralize(count)}.`,
  },
  {
    id: "tinker_self_deaths",
    category: "role",
    roleIds: ["tinker"],
    source: "grimoire_event",
    label: "Oops!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Tinker, ${subject(isMe)} had ${count} fatal mishap${pluralize(count)}.`,
  },
  {
    id: "assassin_kills",
    category: "role",
    roleIds: ["assassin"],
    source: "grimoire_event",
    label: "Certain Death",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Assassin, ${subject(isMe)} killed ${count} player${pluralize(count)}.`,
  },
  {
    id: "assassin_evil_kills",
    category: "role",
    roleIds: ["assassin"],
    source: "grimoire_event",
    label: "Et Tu, Brute?",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.alignment === "EVIL" ||
              previousToken?.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Assassin, ${subject(isMe)} turned your blade on evil ${count} time${pluralize(count)}.`,
  },
  {
    id: "boomdandy_kills",
    category: "role",
    roleIds: ["boomdandy"],
    source: "grimoire_event",
    label: "Kaboom!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Boomdandy, ${subject(isMe)} blown up ${count} player${pluralize(count)}.`,
  },
  {
    id: "boomdandy_max_page_kills",
    category: "role",
    roleIds: ["boomdandy"],
    source: "grimoire_event",
    label: "Blast Radius",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let best = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const countsByPage = new Map<number, number>();

        for (const event of game.grimoire_events) {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.DEATH
          ) {
            continue;
          }

          countsByPage.set(
            event.grimoire_page,
            (countsByPage.get(event.grimoire_page) ?? 0) + 1
          );
        }

        for (const count of countsByPage.values()) {
          if (count > best) best = count;
        }
      }

      return best;
    },
    getSentence: ({ count, isMe }) =>
      `As the Boomdandy, ${isMe ? "your" : "this player's"} largest explosion took out ${count} player${pluralize(count)} at once.`,
  },
  {
    id: "godfather_kills",
    category: "role",
    roleIds: ["godfather"],
    source: "grimoire_event",
    label: "Just Business",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Godfather, ${subject(isMe)} settled ${count} score${pluralize(count)} with your ability.`,
  },
  {
    id: "harpy_kills",
    category: "role",
    roleIds: ["harpy"],
    source: "grimoire_event",
    label: "Foul Presence",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      `As the Harpy, ${subject(isMe)} caused ${count} death${pluralize(count)} through your madness.`,
  },
  {
    id: "al_hadikhia_revives",
    category: "role",
    roleIds: ["al-hadikhia"],
    source: "grimoire_event",
    label: "Death Reversed",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      `As Al-Hadikhia, ${subject(isMe)} had ${count} dead player${pluralize(count)} choose to live, and they did.`,
  },
  {
    id: "al_hadikhia_all_die",
    category: "role",
    roleIds: ["al-hadikhia"],
    source: "grimoire_event",
    label: "All Die",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let total = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const countsByPage = new Map<number, number>();

        for (const event of game.grimoire_events) {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.DEATH
          ) {
            continue;
          }

          countsByPage.set(
            event.grimoire_page,
            (countsByPage.get(event.grimoire_page) ?? 0) + 1
          );
        }

        for (const count of countsByPage.values()) {
          if (count >= 3) {
            total += 1;
          }
        }
      }

      return total;
    },
    getSentence: ({ count, isMe }) =>
      `As Al-Hadikhia, ${subject(isMe)} killed all 3 chosen players ${count} time${pluralize(count)}.`,
  },
  {
    id: "al_hadikhia_self_deaths",
    category: "role",
    roleIds: ["al-hadikhia"],
    source: "grimoire_event",
    label: "I Chose Poorly",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.DEATH
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === roleId ||
              previousToken?.role_id === roleId
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As Al-Hadikhia, ${subject(isMe)} included yourself and ended up dying ${count} time${pluralize(count)}.`,
  },
  {
    id: "al_hadikhia_evil_revives",
    category: "role",
    roleIds: ["al-hadikhia"],
    source: "grimoire_event",
    label: "Back In Service",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.REVIVE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.alignment === "EVIL" ||
              previousToken?.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As Al-Hadikhia, ${subject(isMe)} brought ${count} evil player${pluralize(count)} back to life.`,
  },
  {
    id: "demon_kills_total",
    category: "general",
    source: "grimoire_event",
    label: "Total Demon Kills",
    getCount: ({ games }) =>
      games.reduce((total, game) => {
        if (game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (event.event_type !== GrimoireEventType.DEATH) return false;
            const sourceRole = getByRoleForEvent(game, event);
            return sourceRole?.type === "DEMON";
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the demon, ${subject(isMe)} killed ${count} player${pluralize(count)} in total.`,
    getSubtitle: ({ games }) => getMostCommonByRoleSubtitle(games, isDemonKillEvent),
    getDisplayRole: ({ games }) => getMostCommonByRole(games, isDemonKillEvent),
  },
  {
    id: "angel_deaths",
    category: "role",
    roleIds: ["angel"],
    source: "grimoire_event",
    label: "Divine Retribution",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "angel"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been struck down by the Angel ${count} time${pluralize(count)}.`,
  },
  {
    id: "doomsayer_deaths",
    category: "role",
    roleIds: ["doomsayer"],
    source: "grimoire_event",
    label: "Woe Is Me",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "doomsayer"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} died to the Doomsayer ${count} time${pluralize(count)}.`,
  },
  {
    id: "hells_librarian_deaths",
    category: "role",
    roleIds: ["hells_librarian"],
    source: "grimoire_event",
    label: "Library Fine",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "hells_librarian"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "Hell's Librarian has" : "Hell's Librarian has"} fined ${isMe ? "you" : "this player"} with death ${count} time${pluralize(count)}.`,
  },
  {
    id: "hindu_revives",
    category: "role",
    roleIds: ["hindu"],
    source: "grimoire_event",
    label: "Reincarnated",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.REVIVE &&
          event.by_role_id === "hindu"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been brought back as a Traveller by the Hindu ${count} time${pluralize(count)}.`,
  },
  {
    id: "kazali_minion_changes_received",
    category: "role",
    roleIds: ["kazali"],
    source: "grimoire_event",
    label: "Set Up By Evil",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.by_role_id !== "kazali" ||
            event.event_type !== GrimoireEventType.ROLE_CHANGE
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role?.type === "MINION";
        }
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been turned into a Minion by the Kazali ${count} time${pluralize(count)}.`,
  },
  {
    id: "lord_of_typhon_line_changes_received",
    category: "role",
    roleIds: ["lord_of_typhon"],
    source: "grimoire_event",
    label: "Wrong Place and Time",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "lord_of_typhon"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been changed by being next to the Lord of Typhon ${count} time${pluralize(count)}.`,
  },
  {
    id: "lord_of_typhon_line_changes_caused",
    category: "role",
    roleIds: ["lord_of_typhon"],
    source: "grimoire_event",
    label: "Cosmic Formation",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Lord of Typhon, ${subject(isMe)} changed ${count} player${pluralize(count)} in your formation.`,
  },
  {
    id: "cacklejack_role_changes_caused",
    category: "role",
    roleIds: ["cacklejack"],
    source: "grimoire_event",
    label: "BoiNgo-banGo!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Cacklejack, ${subject(isMe)} changed ${count} player${pluralize(count)} into a different character.`,
  },
  {
    id: "cacklejack_role_changes_received",
    category: "role",
    roleIds: ["cacklejack"],
    source: "grimoire_event",
    label: "GAzOinks!",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "cacklejack"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been changed by the Cacklejack ${count} time${pluralize(count)}.`,
  },
  {
    id: "pit_hag_role_changes_received",
    category: "role",
    roleIds: ["pit_hag"],
    source: "grimoire_event",
    label: "Dropped in the Cauldron",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "pit_hag"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been changed by the Pit-Hag ${count} time${pluralize(count)}.`,
  },
  {
    id: "summoner_demon_changes_received",
    category: "role",
    roleIds: ["summoner"],
    source: "grimoire_event",
    label: "Summoned to Darkness",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "summoner"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role?.type === "DEMON";
        }
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been turned into a demon by the Summoner ${count} time${pluralize(count)}.`,
  },
  {
    id: "fang_gu_possessions_received",
    category: "role",
    roleIds: ["fang_gu"],
    source: "grimoire_event",
    label: "Jumped in the Night",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "fang_gu"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return (
            currentToken?.role_id === "fang_gu" &&
            currentToken.alignment === "EVIL"
          );
        }
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been possessed by the Fang Gu ${count} time${pluralize(count)}.`,
  },
  {
    id: "imp_starpasses_received",
    category: "role",
    roleIds: ["imp"],
    source: "grimoire_event",
    label: "Pass Received",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "imp"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role_id === "imp";
        }
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} received the Starpass ${count} time${pluralize(count)}.`,
  },
  {
    id: "snake_charmer_role_changes_received",
    category: "role",
    roleIds: ["snake_charmer"],
    source: "grimoire_event",
    label: "Snakebit",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "snake_charmer"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been changed by the Snake Charmer ${count} time${pluralize(count)}.`,
  },
  {
    id: "cult_leader_alignment_changes",
    category: "role",
    roleIds: ["cult_leader"],
    source: "grimoire_event",
    label: "Crisis of Faith",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Cult Leader, ${subject(isMe)} changed alignment ${count} time${pluralize(count)}.`,
  },
  {
    id: "cult_leader_evil_cult_wins",
    category: "role",
    roleIds: ["cult_leader"],
    source: "end_trigger",
    label: "Dark Congregation",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.CHARACTER_ABILITY &&
          game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId &&
          game.win_v2 === WinStatus_V2.EVIL_WINS
      ).length,
    getSentence: ({ count, isMe }) =>
      `As the Cult Leader, ${subject(isMe)} won ${count} game${pluralize(count)} by forming an evil cult.`,
  },
  {
    id: "cult_leader_good_cult_wins",
    category: "role",
    roleIds: ["cult_leader"],
    source: "end_trigger",
    label: "Holy Congregation",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.CHARACTER_ABILITY &&
          game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId &&
          game.win_v2 === WinStatus_V2.GOOD_WINS
      ).length,
    getSentence: ({ count, isMe }) =>
      `As the Cult Leader, ${subject(isMe)} won ${count} game${pluralize(count)} by forming a good cult.`,
  },
  {
    id: "goon_alignment_changes",
    category: "role",
    roleIds: ["goon"],
    source: "grimoire_event",
    label: "Shifting Loyalties",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Goon, ${subject(isMe)} changed alignment ${count} time${pluralize(count)}.`,
  },
  {
    id: "ogre_alignment_changes",
    category: "role",
    roleIds: ["ogre"],
    source: "grimoire_event",
    label: "Friend or Foe?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Ogre, ${subject(isMe)} changed alignment ${count} time${pluralize(count)}.`,
  },
  {
    id: "politician_alignment_changes",
    category: "role",
    roleIds: ["politician"],
    source: "grimoire_event",
    label: "Crossing the Aisle",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Politician, ${subject(isMe)} changed alignment ${count} time${pluralize(count)}.`,
  },
  {
    id: "mezepheles_conversions_caused",
    category: "role",
    roleIds: ["mezepheles"],
    source: "grimoire_event",
    label: "A Word, Please?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      `As the Mezepheles, ${subject(isMe)} converted ${count} player${pluralize(count)} with your secret word.`,
  },
  {
    id: "mezepheles_conversions_received",
    category: "role",
    roleIds: ["mezepheles"],
    source: "grimoire_event",
    label: "Spoke the Word",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ALIGNMENT_CHANGE &&
          event.by_role_id === "mezepheles"
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} been converted by the Mezepheles ${count} time${pluralize(count)}.`,
  },
  {
    id: "bounty_hunter_townsfolk_turned_evil",
    category: "role",
    roleIds: ["bounty_hunter"],
    source: "grimoire_event",
    label: "Price of the Hunt",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ALIGNMENT_CHANGE
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              (currentToken?.alignment === "EVIL" ||
                previousToken?.alignment === "EVIL") &&
              (currentToken?.role?.type === "TOWNSFOLK" ||
                previousToken?.role?.type === "TOWNSFOLK")
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Bounty Hunter, ${subject(isMe)} turned ${count} Townsfolk evil.`,
  },
  {
    id: "bounty_hunter_evil_executions",
    category: "role",
    roleIds: ["bounty_hunter"],
    source: "grimoire_event",
    label: "No One Escapes",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.EXECUTION
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.alignment === "EVIL" ||
              previousToken?.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the Bounty Hunter, ${subject(isMe)} executed ${count} evil player${pluralize(count)} by nomination.`,
  },
  {
    id: "bounty_hunter_alignment_changes_received",
    category: "role",
    roleIds: ["bounty_hunter"],
    source: "grimoire_event",
    label: "I Was Framed",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.by_role_id !== "bounty_hunter" ||
            event.event_type !== GrimoireEventType.ALIGNMENT_CHANGE
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.alignment === "EVIL";
        }
      ),
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You've" : "This player has"} turned evil due to the Bounty Hunter ${count} time${pluralize(count)}.`,
  },
  {
    id: "demon_kills_minions",
    category: "general",
    source: "grimoire_event",
    label: "Minions Killed As Demon",
    getCount: ({ games }) =>
      games.reduce((total, game) => {
        if (game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (event.event_type !== GrimoireEventType.DEATH) return false;
            const sourceRole = getByRoleForEvent(game, event);
            const targetToken = getEventCurrentToken(game, event);

            return (
              sourceRole?.type === "DEMON" &&
              targetToken?.role?.type === "MINION"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      `As the demon, ${subject(isMe)} killed ${count} of your own minion${pluralize(count)}.`,
    getSubtitle: ({ games }) =>
      getMostCommonByRoleSubtitle(games, (game, event) => {
        if (event.event_type !== GrimoireEventType.DEATH) return false;
        const sourceRole = getByRoleForEvent(game, event);
        const targetToken = getEventCurrentToken(game, event);
        return sourceRole?.type === "DEMON" && targetToken?.role?.type === "MINION";
      }),
    getDisplayRole: ({ games }) =>
      getMostCommonByRole(games, (game, event) => {
        if (event.event_type !== GrimoireEventType.DEATH) return false;
        const sourceRole = getByRoleForEvent(game, event);
        const targetToken = getEventCurrentToken(game, event);
        return sourceRole?.type === "DEMON" && targetToken?.role?.type === "MINION";
      }),
  },
  {
    id: "nominated_and_killed_demon",
    category: "general",
    source: "end_trigger",
    label: "Nominated And Killed The Demon",
    getCount: ({ games }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_cause === GameEndTriggerCause.NOMINATION
      ).length,
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You have" : "This player has"} nominated and killed the demon ${count} time${pluralize(count)}.`,
    getSubtitle: ({ games }) =>
      getMostCommonEndTriggerRoleSubtitle(games, (game) =>
        game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
        game.end_trigger_cause === GameEndTriggerCause.NOMINATION
      ),
    getDisplayRole: ({ games }) =>
      getMostCommonEndTriggerRole(games, (game) =>
        game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
        game.end_trigger_cause === GameEndTriggerCause.NOMINATION
      ),
  },
  {
    id: "game_ending_abilities",
    category: "general",
    source: "end_trigger",
    label: "Ability Game Endings",
    getCount: ({ games }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          game.end_trigger !== GameEndTrigger.NOT_RECORDED &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY
      ).length,
    getSentence: ({ count, isMe }) =>
      `${isMe ? "You have" : "This player has"} ended ${count} game${pluralize(count)} with a character ability.`,
    getSubtitle: ({ games }) =>
      getMostCommonEndTriggerRoleSubtitle(games, (game) =>
        game.end_trigger !== GameEndTrigger.NOT_RECORDED &&
        game.end_trigger_cause === GameEndTriggerCause.ABILITY
      ),
    getDisplayRole: ({ games }) =>
      getMostCommonEndTriggerRole(games, (game) =>
        game.end_trigger !== GameEndTrigger.NOT_RECORDED &&
        game.end_trigger_cause === GameEndTriggerCause.ABILITY
      ),
  },
];

export function getRoleStatCardDefinition(metricKey: string) {
  return ROLE_STAT_CARD_DEFINITIONS.find((definition) => definition.id === metricKey) ?? null;
}

export function getAvailableRoleCardDefinitions(games: GameRecord[], roleId: string) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    if (!definition.roleIds?.includes(roleId)) return false;
    return definition.getCount({ games, roleId }) > 0;
  });
}

export function getAvailableGeneralCardDefinitions(games: GameRecord[]) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "general") return false;
    return definition.getCount({ games }) > 0;
  });
}

export function getRoleCardDefinitions(roleId: string) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    return definition.roleIds?.includes(roleId) ?? false;
  });
}

export function getGeneralCardDefinitions() {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    return definition.category === "general";
  });
}

export function buildRoleStatCardResult(
  card: RoleStatCardRecord,
  games: GameRecord[],
  isMe: boolean,
  username?: string
): RoleStatCardResult {
  const definition = getRoleStatCardDefinition(card.metric_key);
  const roleName = card.role?.name ?? null;

  if (!definition) {
    return {
      count: 0,
      sentence: "This stat card is no longer configured.",
      metricLabel: "Unknown Stat Card",
      subtitle: null,
      displayRole: null,
    };
  }

  const count = definition.getCount({
    games,
    roleId: card.role_id,
    roleName,
    isMe,
    username,
  });

  return {
    count,
    metricLabel: definition.label,
    sentence: definition.getSentence({
      games,
      count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }),
    subtitle:
      definition.getSubtitle?.({
        games,
        count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }) ?? null,
    displayRole:
      definition.getDisplayRole?.({
        games,
        count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }) ?? null,
  };
}

export function buildRoleStatCardPreview(
  definitionId: string,
  games: GameRecord[],
  isMe: boolean,
  role?: RoleStatCardRecord["role"] | null,
  username?: string
) {
  const definition = getRoleStatCardDefinition(definitionId);
  if (!definition) return null;

  const count = definition.getCount({
    games,
    roleId: role?.id ?? null,
    roleName: role?.name ?? null,
    isMe,
    username,
  });

  return {
    id: 0,
    role_id: role?.id ?? null,
    source: definition.source,
    metric_key: definition.id,
    storyteller_only: false,
    role: role ?? null,
    preview: {
      count,
      metricLabel: definition.label,
      sentence: definition.getSentence({
        games,
        count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }),
      subtitle:
        definition.getSubtitle?.({
          games,
          count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }) ?? null,
      displayRole:
        definition.getDisplayRole?.({
          games,
          count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }) ?? null,
    },
  };
}

function countEventsAffectingPlayer(
  games: GameRecord[],
  username: string | undefined,
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  if (!username) return 0;

  let total = 0;

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    const participantIds = new Set(
      game.grimoire
        .flatMap((page) => page.tokens)
        .filter((token) => token.player?.username === username)
        .map((token) => token.grimoire_participant_id)
        .filter((id): id is string => !!id)
    );

    if (!participantIds.size) continue;

    total += game.grimoire_events.filter(
      (event) => participantIds.has(event.participant_id) && predicate(game, event)
    ).length;
  }

  return total;
}

function countGrimoireEvents(
  games: GameRecord[],
  roleId: string | null | undefined,
  eventType: GrimoireEventType
) {
  if (!roleId) return 0;

  return games.reduce((total, game) => {
    if (game.ignore_for_stats) return total;

    return (
      total +
      game.grimoire_events.filter(
        (event) => event.by_role_id === roleId && event.event_type === eventType
      ).length
    );
  }, 0);
}

function getEventCurrentToken(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  return (
    game.grimoire[event.grimoire_page]?.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null
  );
}

function getEventPreviousToken(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (event.grimoire_page <= 0) return null;

  return (
    game.grimoire[event.grimoire_page - 1]?.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null
  );
}

function getByRoleForEvent(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (!event.by_role_id) return null;

  const current = game.grimoire[event.grimoire_page]?.tokens.find(
    (token) => token.grimoire_participant_id === event.by_participant_id
  );
  if (current?.role_id === event.by_role_id) return current.role ?? null;

  const previous =
    event.grimoire_page > 0
      ? game.grimoire[event.grimoire_page - 1]?.tokens.find(
          (token) => token.grimoire_participant_id === event.by_participant_id
        )
      : null;

  if (previous?.role_id === event.by_role_id) return previous.role ?? null;

  const anyMatch =
    game.grimoire[event.grimoire_page]?.tokens.find(
      (token) => token.role_id === event.by_role_id
    ) ??
    (event.grimoire_page > 0
      ? game.grimoire[event.grimoire_page - 1]?.tokens.find(
          (token) => token.role_id === event.by_role_id
        )
      : null);

  return anyMatch?.role ?? null;
}

function getMostCommonByRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  const top = getMostCommonByRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

function getMostCommonByRole(
  games: GameRecord[],
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  const counts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    for (const event of game.grimoire_events) {
      if (!predicate(game, event)) continue;
      const role = getByRoleForEvent(game, event);
      if (!role?.id || !role.name || !role.token_url || !role.type || !role.initial_alignment) continue;

      const existing = counts.get(role.id) ?? {
        role: {
          id: role.id,
          name: role.name,
          token_url: role.token_url,
          type: role.type,
          initial_alignment: role.initial_alignment,
        },
        count: 0,
      };
      existing.count += 1;
      counts.set(role.id, existing);
    }
  }

  const top = Array.from(counts.values()).sort((a, b) => b.count - a.count)[0];
  return top?.role ?? null;
}

function getMostCommonEndTriggerRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord) => boolean
) {
  const top = getMostCommonEndTriggerRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

function getMostCommonEndTriggerRole(
  games: GameRecord[],
  predicate: (game: GameRecord) => boolean
) {
  const counts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (
      game.ignore_for_stats ||
      !predicate(game) ||
      !game.end_trigger_role?.id ||
      !game.end_trigger_role?.name
    ) {
      continue;
    }

    const existing = counts.get(game.end_trigger_role.id) ?? {
      role: {
        id: game.end_trigger_role.id,
        name: game.end_trigger_role.name,
        token_url: game.end_trigger_role.token_url,
        type: game.end_trigger_role.type,
        initial_alignment: game.end_trigger_role.initial_alignment,
      },
      count: 0,
    };
    existing.count += 1;
    counts.set(game.end_trigger_role.id, existing);
  }

  const top = Array.from(counts.values()).sort((a, b) => b.count - a.count)[0];
  return top?.role ?? null;
}

function isDemonKillEvent(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (event.event_type !== GrimoireEventType.DEATH) return false;
  const sourceRole = getByRoleForEvent(game, event);
  return sourceRole?.type === "DEMON";
}

function pluralize(count: number) {
  return count === 1 ? "" : "s";
}

function subject(isMe: boolean) {
  return isMe ? "you've" : "this player has";
}

function rolePrefix(roleName?: string | null) {
  if (!roleName) return "this role";
  if (roleName.startsWith("The ")) return roleName;
  if (["Legion", "Lil' Monsta", "Riot"].includes(roleName)) return roleName;
  return `the ${roleName}`;
}
