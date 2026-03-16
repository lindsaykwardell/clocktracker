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

export const GENERAL_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
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
      count > 0
        ? `As the demon, you've killed ${count} player${pluralize(count)} in total.`
        : `As the demon, kill a player.`,
    getSubtitle: ({ games }) => getMostCommonByRoleSubtitle(games, isDemonKillEvent),
    getDisplayRole: ({ games }) => getMostCommonByRole(games, isDemonKillEvent),
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
      count > 0
        ? `As the demon, you've killed ${count} of your own minion${pluralize(count)}.`
        : `As the demon, kill one of your own minions.`,
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
      count > 0
        ? `${isMe ? "You have" : "This player has"} nominated and executed the demon ${count} time${pluralize(count)}.`
        : `Nominate and execute the demon.`,
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
      count > 0
        ? `${isMe ? "You have" : "This player has"} ended ${count} game${pluralize(count)} with a character ability.`
        : `End a game with a character ability.`,
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
