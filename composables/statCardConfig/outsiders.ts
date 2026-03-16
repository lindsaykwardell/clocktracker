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

export const OUTSIDERS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  // Outsiders
  // ------------------------ 
  {
    // @todo: these are pairs so halve this number?
    id: "barber_role_swaps",
    category: "role",
    roleIds: ["barber"],
    script: 'snv',
    source: "grimoire_event",
    label: "Shear Chaos",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Barber, you've caused ${count} player${pluralize(count)} to swap characters when you died.`
          : `As the Barber, this player has caused ${count} player${pluralize(count)} to swap characters when they died.`)
        : `As the Barber, cause players to swap characters when you die.`,
  },
  {
    id: "butler_master_received",
    category: "role",
    roleIds: ["butler"],
    script: 'tb',
    source: "grimoire_event",
    label: "At Your Service",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.by_role_id === "butler" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Master"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been chosen as master by the Butler ${count} time${pluralize(count)}.`
          : `This player has been chosen as master by the Butler ${count} time${pluralize(count)}.`)
        : `Be chosen as master by the Butler.`,
  },
  {
    id: "damsel_game_endings",
    category: "role",
    roleIds: ["damsel"],
    script: "experimental",
    source: "end_trigger",
    label: "Happily Never After",
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
          ? `As the Damsel, you've ended the game ${count} time${pluralize(count)} due to your ability.`
          : `As the Damsel, this player has ended the game ${count} time${pluralize(count)} due to their ability.`)
        : `As the Damsel, end the game due to your ability.`,
  },
  // Drunk: Nothing to track really.
  {
    id: "golem_kills",
    category: "role",
    roleIds: ["golem"],
    script: "experimental",
    source: "grimoire_event",
    label: "Golem Smash",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Golem, you've has killed ${count} player${pluralize(count)} with your nomination.`
          : `As the Golem, this player has killed ${count} player${pluralize(count)} with their nomination.`)
        : `As the Golem, kill a player with your nomination.`,
  },
  {
    id: "golem_evil_kills",
    category: "role",
    roleIds: ["golem"],
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Golem, you've crushed ${count} evil player${pluralize(count)} with your nomination.`
          : `As the Golem, this player has crushed ${count} evil player${pluralize(count)} with their nomination.`)
        : `As the Golem, kill an evil player with your nomination.`,
  },
  {
    id: "goon_alignment_changes",
    category: "role",
    roleIds: ["goon"],
    script: 'bmr',
    source: "grimoire_event",
    label: "Shifting Loyalties",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Goon, you've changed alignment ${count} time${pluralize(count)}.`
          : `As the Goon, this player has changed alignment ${count} time${pluralize(count)}.`)
        : `As the Goon, change alignment due to your ability.`,
  },
  {
    id: "goon_drunk_received",
    category: "role",
    roleIds: ["goon"],
    script: 'bmr',
    source: "grimoire_event",
    label: "A Friendly Explanation",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "goon"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `Picking the Goon, you've ended up drunk ${count} time${pluralize(count)}.`
          : `Picking the Goon, this player has ended up drunk ${count} time${pluralize(count)}.`)
        : `Become drunk by picking the Goon.`,
  },
  {
    id: "hatter_role_changes",
    category: "role",
    roleIds: ["hatter"],
    script: "experimental",
    source: "grimoire_event",
    label: "Tea Party Tonight",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Hatter, you've caused ${count} evil character change${pluralize(count)} when you died.`
          : `As the Hatter, this player has caused ${count} evil character change${pluralize(count)} when they died.`)
        : `As the Hatter, cause evil players to change characters when you die.`,
  },
  // Heretic: Nothing to track really.
  // Hermit: Too complex?
  {
    id: "klutz_game_endings",
    category: "role",
    roleIds: ["klutz"],
    script: 'snv',
    source: "end_trigger",
    label: "Fatal Fumble",
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
          ? `As the Klutz, you've ended ${count} game${pluralize(count)} by making the wrong choice.`
          : `As the Klutz, this player has ended a game ${count} time${pluralize(count)} by making the wrong choice.`)
        : `As the Klutz, end a game due to your ability.`,
  },
  // Lunatic: @todo (Followed picks?)
  {
    id: "moonchild_kills",
    category: "role",
    roleIds: ["moonchild"],
    script: 'bmr',
    source: "grimoire_event",
    label: "Star-Crossed",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Moonchild, you've doomed ${count} player${pluralize(count)} with your choice.`
          : `As the Moonchild, this player has doomed ${count} player${pluralize(count)} with their choice.`)
        : `As the Moonchild, kill a player with your choice.`,
  },
  {
    id: "moonchild_spy_kills",
    category: "role",
    roleIds: ["moonchild"],
    script: "experimental", // Not possible on their base script
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
      count > 0
        ? (isMe
          ? `As the Moonchild, you've doomed the Spy ${count} time${pluralize(count)}.`
          : `As the Moonchild, this player has doomed the Spy ${count} time${pluralize(count)}.`)
        : `As the Moonchild, kill the Spy due to your ability.`,
  },
  {
    id: "mutant_executions",
    category: "role",
    roleIds: ["mutant"],
    script: 'snv',
    source: "grimoire_event",
    label: "Slip of the Tongue",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mutant, you've been executed ${count} time${pluralize(count)} for revealing yourself.`
          : `As the Mutant, this player has been executed ${count} time${pluralize(count)} for revealing themselves.`)
        : `As the Mutant, be executed due to your ability.`,
  },
  {
    id: "ogre_alignment_changes",
    category: "role",
    roleIds: ["ogre"],
    script: "experimental",
    source: "grimoire_event",
    label: "Friend or Foe?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Ogre, you've changed alignment ${count} time${pluralize(count)}.`
          : `As the Ogre, this player has changed alignment ${count} time${pluralize(count)}.`)
        : `As the Ogre, change alignment due to your ability.`,
  },
  // Plague Doctor: @todo
  {
    id: "politician_alignment_changes",
    category: "role",
    roleIds: ["politician"],
    script: "experimental",
    source: "grimoire_event",
    label: "Crossing the Aisle",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Politician, you've changed alignment at the end of a game ${count} time${pluralize(count)}.`
          : `As the Politician, this player has changed alignment at the end of a game ${count} time${pluralize(count)}.`)
        : `As the Politician, change alignment due to your ability.`,
  },
  // Puzzle Master: @todo
  // Recluse: @todo
  {
    id: "saint_game_endings",
    category: "role",
    roleIds: ["saint"],
    script: 'tb',
    source: "end_trigger",
    label: "Holy Misfire",
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
          ? `As the Saint, you've ended ${count} game${pluralize(count)} by getting executed.`
          : `As the Saint, this player has ended ${count} game${pluralize(count)} by getting executed.`)
        : `As the Saint, cause a game to end due to your ability.`,
  },
  {
    id: "saint_game_endings_caused",
    category: "role",
    roleIds: ["saint"],
    script: 'tb',
    source: "end_trigger",
    label: "Condemned the Holy",
    getCount: ({ games, username }) => {
      if (!username) return 0;

      return games.reduce((total, game) => {
        if (game.ignore_for_stats) return total;

        const endedBySaintAbility =
          game.end_trigger === GameEndTrigger.CHARACTER_ABILITY &&
          game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === "saint";
        if (!endedBySaintAbility) return total;

        const participantIds = new Set(
          game.grimoire
            .flatMap((page) => page.tokens)
            .filter((token) => token.player?.username === username)
            .map((token) => token.grimoire_participant_id)
            .filter((id): id is string => !!id)
        );
        if (!participantIds.size) return total;

        const causedSaintExecution = game.grimoire_events.some((event) => {
          if (
            event.event_type !== GrimoireEventType.EXECUTION ||
            !event.by_participant_id ||
            !participantIds.has(event.by_participant_id)
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);

          return (
            currentToken?.role_id === "saint" ||
            previousToken?.role_id === "saint"
          );
        });

        return total + (causedSaintExecution ? 1 : 0);
      }, 0);
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've ended the game by executing the Saint ${count} time${pluralize(count)}.`
          : `This player has ended the game by executing the Saint ${count} time${pluralize(count)}.`)
        : `End the game by executing the Saint.`,
  },
  // Snitch: Nothing to track really.
  {
    id: "sweetheart_drunk_on_death",
    category: "role",
    roleIds: ["sweetheart"],
    script: 'snv',
    source: "grimoire_event",
    label: "Heartbreak Hangover",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Sweetheart, you've made ${count} player${pluralize(count)} drunk when you died.`
          : `As the Sweetheart, this player has made ${count} player${pluralize(count)} drunk when they died.`)
        : `As the Sweetheart, make a player drunk when you die.`,
  },
  {
    id: "sweetheart_drunk_received",
    category: "role",
    roleIds: ["sweetheart"],
    script: 'snv',
    source: "grimoire_event",
    label: "Grief-Struck",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "sweetheart"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been made drunk by the Sweetheart ${count} time${pluralize(count)}.`
          : `This player has been made drunk by the Sweetheart ${count} time${pluralize(count)}.`)
        : `Be made drunk by the Sweetheart.`,
  },
  {
    id: "tinker_deaths_self",
    category: "role",
    roleIds: ["tinker"],
    script: 'bmr',
    source: "grimoire_event",
    label: "Oops!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Tinker, you've had ${count} fatal mishap${pluralize(count)}.`
          : `As the Tinker, this player has had ${count} fatal mishap${pluralize(count)}.`)
        : `As the Tinker, die due to your ability.`,
  },
  // Zealot: Nothing to track really.
];
