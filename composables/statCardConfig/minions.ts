import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  GrimoireEventType,
  WinStatus_V2,
} from "~/composables/useGames";
import {
  countEventsAffectingPlayer,
  countGrimoireEvents,
  getByRoleForEvent,
  getEventCurrentToken,
  getEventPreviousToken,
  getMostCommonByRole,
  getMostCommonByRoleSubtitle,
  getMostCommonEndTriggerRole,
  getMostCommonEndTriggerRoleSubtitle,
  isDemonKillEvent,
  pluralize,
} from "./shared";
import type { RoleStatCardDefinition } from "./shared";

export const MINIONS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "assassin_kills",
    category: "role",
    roleIds: ["assassin"],
    script: "bmr",
    source: "grimoire_event",
    label: "Certain Death",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Assassin, you've killed ${count} player${pluralize(count)}.`
          : `As the Assassin, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Assassin, kill a player with your ability.`,
  },
  {
    id: "assassin_evil_kills",
    category: "role",
    roleIds: ["assassin"],
    script: "bmr",
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
      count > 0
        ? (isMe
          ? `As the Assassin, you've turned your blade on an evil player ${count} time${pluralize(count)}.`
          : `As the Assassin, this player has turned their blade on an evil player ${count} time${pluralize(count)}.`)
        : `As the Assassin, kill an evil player with your ability.`,
  },
  // Baron: Nothing to track really.
  // Boffin: @todo Some end triggers?
  {
    id: "boomdandy_kills",
    category: "role",
    roleIds: ["boomdandy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Kaboom!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Boomdandy, you've blown up ${count} player${pluralize(count)}.`
          : `As the Boomdandy, this player has blown up ${count} player${pluralize(count)}.`)
        : `As the Boomdandy, kill a player with your ability.`,
  },
  {
    id: "boomdandy_max_page_kills",
    category: "role",
    roleIds: ["boomdandy"],
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Boomdandy, your largest explosion took out ${count} player${pluralize(count)} at once.`
          : `As the Boomdandy, this player's largest explosion took out ${count} player${pluralize(count)} at once.`)
        : `As the Boomdandy, kill multiple players at once with your ability.`,
  },
  {
    id: "cerenovus_madness_applied",
    category: "role",
    roleIds: ["cerenovus"],
    script: "snv",
    source: "grimoire_event",
    label: "Reality Override",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.MAD),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cerenovus, you've made ${count} player${pluralize(count)} mad.`
          : `As the Cerenovus, this player has made ${count} player${pluralize(count)} mad.`)
        : `As the Cerenovus, make a player mad.`,
  },
  {
    id: "cerenovus_executions",
    category: "role",
    roleIds: ["cerenovus"],
    script: "snv",
    source: "grimoire_event",
    label: "Forced Compliance",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cerenovus, you've caused ${count} execution${pluralize(count)} from broken madness.`
          : `As the Cerenovus, this player has caused ${count} execution${pluralize(count)} from broken madness.`)
        : `As the Cerenovus, cause an execution due to your ability.`,
  },
  // Devil's Advocate: Would be cool if we could track how many times they saved somebody.
  // Evil Twin: @todo
  {
    id: "fearmonger_game_endings",
    category: "role",
    roleIds: ["fearmonger"],
    script: "experimental",
    source: "end_trigger",
    label: "Fear Decides",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.CHARACTER_ABILITY &&
          game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fearmonger, you've ended ${count} game${pluralize(count)} by nominating and executing your target.`
          : `As the Fearmonger, this player ended ${count} game${pluralize(count)} by nominating and executing their target.`)
        : `As the Fearmonger, end a game due to your ability.`,
  },
  // Goblin: @todo Check how many times player executed a goblin after claiming?
  {
    id: "goblin_ability_wins",
    category: "role",
    roleIds: ["goblin"],
    script: "experimental",
    source: "end_trigger",
    label: "Last Laugh",
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
      count > 0
        ? (isMe
          ? `As the Goblin, you've won ${count} game${pluralize(count)} by being executed after claiming Goblin.`
          : `As the Goblin, this player has won ${count} game${pluralize(count)} by being executed after claiming Goblin.`)
        : `As the Goblin, win a game due to your ability.`,
  },
  {
    id: "godfather_kills",
    category: "role",
    roleIds: ["godfather"],
    script: "bmr",
    source: "grimoire_event",
    label: "Just Business",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Godfather, you've settled ${count} score${pluralize(count)}.`
          : `As the Godfather, this player has settled ${count} score${pluralize(count)}.`)
        : `As the Godfather, kill a player with your ability.`,
  },
  {
    id: "harpy_kills",
    category: "role",
    roleIds: ["harpy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Maddening Carnage",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harpy, you've caused ${count} death${pluralize(count)} through your madness.`
          : `As the Harpy, this player has caused ${count} death${pluralize(count)} through their madness.`)
        : `As the Harpy, kill a player due to your ability.`,
  },
  {
    id: "harpy_madness_applied",
    category: "role",
    roleIds: ["harpy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Foul Presence",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.MAD),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harpy, you've caused made ${count} player${pluralize(count)} mad.`
          : `As the Harpy, this player has made ${count} player${pluralize(count)} mad.`)
        : `As the Harpy, make a player mad.`,
  },
  // Marionette: Nothing to track really.
  {
    id: "mastermind_game_endings",
    category: "role",
    roleIds: ["mastermind"],
    script: "bmr",
    source: "end_trigger",
    label: "Planned Finale",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.CHARACTER_ABILITY &&
          game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mastermind, you've ended the game ${count} time${pluralize(count)} due to your ability.`
          : `As the Mastermind, this player has ended the game ${count} time${pluralize(count)} due to their ability.`)
        : `As the Mastermind, end the game due to your ability.`,
  },
  {
    id: "mastermind_ability_wins",
    category: "role",
    roleIds: ["mastermind"],
    script: "bmr",
    source: "end_trigger",
    label: "Perfect Scheme",
    getCount: ({ games, roleId }) =>
      // After a Mastermind-triggered ending, this tracks EVIL_WINS as the
      // typical case. It intentionally ignores rare edge cases where alignment
      // could differ, to keep this stat simple and consistent.
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
      count > 0
        ? (isMe
          ? `As the Mastermind, you've won ${count} game${pluralize(count)} when your ability ended the game.`
          : `As the Mastermind, this player has won ${count} game${pluralize(count)} when their ability ended the game.`)
        : `As the Mastermind, win when your ability ends the game.`,
  },
  {
    id: "mezepheles_ability_changes_caused",
    category: "role",
    roleIds: ["mezepheles"],
    script: "experimental",
    source: "grimoire_event",
    label: "A Word, Please?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mezepheles, you've changed the alignment of ${count} player${pluralize(count)} with your secret word.`
          : `As the Mezepheles, this player has changed the alignment of ${count} player${pluralize(count)} with their secret word.`)
        : `As the Mezepheles, change the alignment of a player due to your ability.`,
  },
  {
    id: "mezepheles_ability_changes_received",
    category: "role",
    roleIds: ["mezepheles"],
    script: "experimental",
    source: "grimoire_event",
    label: "The Forbidden Word",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ALIGNMENT_CHANGE &&
          event.by_role_id === "mezepheles"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've switched alignment due to the Mezepheles ${count} time${pluralize(count)}.`
          : `This player switched alignment due to the Mezepheles ${count} time${pluralize(count)}.`)
        : `Switch alignment due to the Mezepheles.`,
  },
  {
    id: "organ_grinder_self_drunk",
    category: "role",
    roleIds: ["organ_grinder"],
    script: "experimental",
    source: "grimoire_event",
    label: "Drank the Music",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.DRUNK &&
              !!event.by_participant_id &&
              event.participant_id === event.by_participant_id
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Organ Grinder, you've chose to become drunk ${count} time${pluralize(count)}.`
          : `As the Organ Grinder, this player has chosen to become drunk ${count} time${pluralize(count)}.`)
        : `As the Organ Grinder, choose to become drunk due to your ability.`,
  },
  {
    id: "pit_hag_role_changes_caused",
    category: "role",
    roleIds: ["pit_hag"],
    script: "snv",
    source: "grimoire_event",
    label: "Cauldron's Work",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've changed at least ${count} player${pluralize(count)} into a different character.`
          : `As the Pit-Hag, this player has changed at least ${count} player${pluralize(count)} into a different character.`)
        : `As the Pit-Hag, change a player into a different character.`,
  },
  {
    id: "pit_hag_good_demons_created",
    category: "role",
    roleIds: ["pit-hag"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've created ${count} good demon${pluralize(count)}.`
          : `As the Pit-Hag, this player has created ${count} good demon${pluralize(count)}.`)
        : `As the Pit-Hag, create a good demon.`,
  },
  {
    id: "pit_hag_accidental_game_endings",
    category: "role",
    roleIds: ["pit-hag"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've ended the game ${count} time${pluralize(count)} by removing the last living demon.`
          : `As the Pit-Hag, this player has ended the game ${count} time${pluralize(count)} by removing the last living demon.`)
        : `As the Pit-Hag, end the game by removing the last living demon.`,
  },
  {
    id: "pit_hag_demon_to_demon_changes",
    category: "role",
    roleIds: ["pit-hag"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've turned the demon into another demon ${count} time${pluralize(count)}.`
          : `As the Pit-Hag, this player has turned the demon into another demon ${count} time${pluralize(count)}.`)
        : `As the Pit-Hag, turn the demon into another demon.`,
  },
  {
    id: "pit_hag_self_changes",
    category: "role",
    roleIds: ["pit-hag"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've changed yourself ${count} time${pluralize(count)}.`
          : `As the Pit-Hag, this player has changed yourself ${count} time${pluralize(count)}.`)
        : `As the Pit-Hag, change yourself into a different character.`,
  },
  {
    id: "pit_hag_role_changes_received",
    category: "role",
    roleIds: ["pit-hag"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've been changed into a different character by the Pit-Hag ${count} time${pluralize(count)}.`
          : `As the Pit-Hag, this player has been changed into a different character by the Pit-Hag ${count} time${pluralize(count)}.`)
        : `Be changed into a different character by the Pit-Hag.`,
  },
  {
    id: "poisoner_poisoned_caused",
    category: "role",
    roleIds: ["poisoner"],
    script: "tb",
    source: "grimoire_event",
    label: "Deadly Drip",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.POISONED),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Poisoner, you've poisoned ${count} player${pluralize(count)}.`
          : `As the Poisoner, this player has poisoned ${count} player${pluralize(count)}.`)
        : `As the Poisoner, poison a player.`,
  },
  {
    id: "psychopath_kills",
    category: "role",
    roleIds: ["psychopath"],
    script: "experimental",
    source: "grimoire_event",
    label: "Here's Johnny!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Psychopath, you've axed ${count} player${pluralize(count)} in broad daylight.`
          : `As the Psychopath, this player has axed ${count} player${pluralize(count)} in broad daylight.`)
        : `As the Psychopath, kill a player with your ability.`,
  },
  {
    id: "scarlet_woman_demon_changes",
    category: "role",
    roleIds: ["scarlet_woman"],
    script: "tb",
    source: "grimoire_event",
    label: "The New Master",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Scarlet Woman, you've inherited the demon's mantle ${count} time${pluralize(count)}.`
          : `As the Scarlet Woman, this player has inherited the demon's mantle ${count} time${pluralize(count)}.`)
        : `As the Scarlet Woman, become a demon when a demon dies.`,
  },
  // Spy: @todo
  {
    id: "summoner_demon_changes",
    category: "role",
    roleIds: ["summoner"],
    script: "experimental",
    source: "grimoire_event",
    label: "The Ritual Complete",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Summoner, you've successfully summoned a demon ${count} time${pluralize(count)}.`
          : `As the Summoner, this player has successfully summoned a demon ${count} time${pluralize(count)}.`)
        : `As the Summoner, successfully summoned a demon with you ability.`,
  },
  {
    id: "summoner_demon_changes_received",
    category: "role",
    roleIds: ["summoner"],
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `You've been turned into a demon by the Summoner ${count} time${pluralize(count)}.`
          : `This player has been turned into a demon by the Summoner ${count} time${pluralize(count)}.`)
        : `Be turned into a demon by the Summoner.`,
  },
  // Summonner: @todo Game ends
  {
    id: "vizier_forced_executions",
    category: "role",
    roleIds: ["vizier"],
    script: "experimental",
    source: "grimoire_event",
    label: "Judge, Jury, Executioner",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vizier, you've forced ${count} execution${pluralize(count)}.`
          : `As the Vizier, you've forced ${count} execution${pluralize(count)}.`)
        : `As the Vizier, force an execution.`,
  },
  {
    id: "vizier_killed_by_demon",
    category: "role",
    roleIds: ["vizier"],
    script: "experimental",
    source: "grimoire_event",
    label: "Courtly Assassination",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.event_type !== GrimoireEventType.DEATH ||
              !isDemonKillEvent(game, event)
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
      count > 0
        ? (isMe
          ? `As the Vizier, you've been killed by the Demon ${count} time${pluralize(count)}.`
          : `As the Vizier, this player has been killed by the Demon ${count} time${pluralize(count)}.`)
        : `As the Vizier, be killed by the Demon.`,
  },
  {
    id: "vizier_forced_executions_received",
    category: "role",
    roleIds: ["vizier"],
    script: "experimental",
    source: "grimoire_event",
    label: "Forced to the Gallows",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.EXECUTION &&
          event.by_role_id === "vizier"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been force executed by the Vizier ${count} time${pluralize(count)}.`
          : `This player has been force executed by the Vizier ${count} time${pluralize(count)}.`)
        : `Be force executed by the Vizier.`,
  },
  {
    id: "widow_poisoned",
    category: "role",
    roleIds: ["widow"],
    script: "experimental",
    source: "grimoire_event",
    label: "Spider's Kiss",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.POISONED),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Widow, you've poisoned ${count} player${pluralize(count)}.`
          : `As the Widow, this player has poisoned ${count} player${pluralize(count)}.`)
        : `As the Widow, poison a player.`,
  },
  {
    id: "widow_self_poisoned",
    category: "role",
    roleIds: ["widow"],
    script: "experimental",
    source: "grimoire_event",
    label: "Keep it Secret, Keep it Safe",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.POISONED &&
              !!event.by_participant_id &&
              event.participant_id === event.by_participant_id
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Widow, you've chosen to poison yourself ${count} time${pluralize(count)}.`
          : `As the Widow, this player chosen to poison yourself ${count} time${pluralize(count)}.`)
        : `As the Widow, choose to poison yourself.`,
  },
  {
    id: "witch_kills",
    category: "role",
    roleIds: ["witch"],
    script: "snv",
    source: "grimoire_event",
    label: "Curses!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Witch, you've caused ${count} player${pluralize(count)} to die due to your curse.`
          : `As the Witch, this player has caused ${count} player${pluralize(count)} to die due to their curse.`)
        : `As the Witch, have a player die due to your ability.`,
  },
  // Wizard: Too complex
  // Wraith: Nothing to track really.
  // Xaan: Nothing to track really.
];
