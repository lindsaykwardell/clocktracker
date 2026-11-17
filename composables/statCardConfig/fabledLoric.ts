import {
  GameEndTrigger,
  GameEndTriggerCause,
  GrimoireEventType,
  WinStatus_V2,
} from "~/composables/useGames";
import {
  countMatchingEvents,
  countGrimoireEvents,
  getByRoleForEvent,
  getEventCurrentToken,
  getEventPreviousToken,
  getMostCommonByRole,
  getMostCommonByRoleSubtitle,
  isDemonKillEvent,
  pluralize,
  times,
} from "./shared";
import type { RoleStatCardDefinition } from "./shared";

export const FABLEDLORIC_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "angel_deaths",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["angel"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Divine Retribution",
    hidden: true,
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "angel"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been punished with death by the Angel ${times(count)}.`
          : `This player has been punished with death by the Angel ${times(count)}.`)
        : `Be punished with death by the Angel.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been punished with death by the Angel at least ${times(count)}.`
        : `No player has been punished with death by the Angel yet.`,
  },
  // Buddhist: OK.
  {
    id: "doomsayer_deaths",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["doomsayer"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Woe Is Me",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "doomsayer"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've died to the Doomsayer ${times(count)}.`
          : `This player has died to the Doomsayer ${times(count)}.`)
        : `Die to the Doomsayer.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has died to the Doomsayer at least ${times(count)}.`
        : `No player has died to the Doomsayer yet.`,
  },
  {
    id: "hells_librarian_deaths",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["hells_librarian"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Library Fine",
    hidden: true,
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DEATH &&
          event.by_role_id === "hells_librarian"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been punished with death by Hell's Librarian ${times(count)}.`
          : `This player has been punished with death by Hell's Librarian ${times(count)}.`)
        : `Be punished with death by Hell's Librarian.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been punished with death by Hell's Librarian at least ${times(count)}.`
        : `No player has been punished with death by Hell's Librarian yet.`,
  },
  {
    id: "fiddler_game_end_trigger_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["fiddler"],
    scope: "affected_player",
    script: "npc",
    source: "game",
    label: "Georgia Showdown",
    getCount: ({ games }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === "fiddler"
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've had ${count} game${pluralize(count)} end due to the Fiddler.`
          : `This player has had ${count} game${pluralize(count)} end due to the Fiddler.`)
        : `Have a game end due to the Fiddler.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ended due to the Fiddler.`
        : `No game has ended due to the Fiddler yet.`,
  },
  // Revolutionary: Nothing to track really.
  // Toymaker: Nothing to track really.
  // Djinn: Nothing to track really.
  // Duchess: Nothing to track really.
  // Fibbin: Nothing to track really.
  // Sentinel: Nothing to track really.
  // Spirit of Ivory: Nothing to track really.
  // Deus Ex Fiasco: Nothing to track really.
  // Ferryman: Nothing to track really.
  {
    id: "big_wig_deaths_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["big_wig"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Off with Their Head",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "big_wig" &&
          event.event_type === GrimoireEventType.DEATH &&
          event.status_source === "DEAD"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've died due to the Big Wig ${times(count)}.`
          : `This player has died due to the Big Wig ${times(count)}.`)
        : `Die due to the Big Wig.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has died due to the Big Wig at least ${times(count)}.`
        : `No player has died due to the Big Wig yet.`,
  },
  // Bootlegger: Too complex
  // Gardener: Nothing to track really.
  {
    id: "hindu_revives",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["hindu"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Reincarnated",
    // A reincarnation is a revive when the storyteller recorded a page where
    // the player was dead, and otherwise only a character change into the
    // Traveller. Each player counts once per game, whichever was recorded.
    getCount: ({ games }) => {
      let total = 0;
      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const players = new Set<string>();
        for (const event of game.grimoire_events) {
          const reincarnated =
            event.by_role_id === "hindu" &&
            (event.event_type === GrimoireEventType.REVIVE ||
              event.event_type === GrimoireEventType.ROLE_CHANGE);
          if (reincarnated) players.add(event.participant_id || `event:${event.id}`);
        }
        total += players.size;
      }
      return total;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been brought back as a Traveller by the Hindu ${times(count)}.`
          : `This player has been brought back as a Traveller by the Hindu ${times(count)}.`)
        : `Be brought back as a Traveller by the Hindu.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been brought back as a Traveller by the Hindu at least ${times(count)}.`
        : `No player has been brought back as a Traveller by the Hindu yet.`,
  },
  // Pope: Nothing to track really.
  {
    id: "storm_catcher_protected_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["storm_catcher"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Eye of the Storm",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "storm_catcher" &&
          event.event_type === GrimoireEventType.OTHER &&
          (event.status_source === "Stormcaught" || event.status_source === "Safe")
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been protected by the Storm Catcher ${times(count)}.`
          : `This player has been protected by the Storm Catcher ${times(count)}.`)
        : `Be protected by the Storm Catcher.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been protected by the Storm Catcher at least ${times(count)}.`
        : `No player has been protected by the Storm Catcher yet.`,
  },
  // Tor: Nothing to track really.
  // Ventriloquist: @todo ?
  {
    id: "zenomancer_goals_assigned_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["zenomancer"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Threads of Fate",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "zenomancer" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Goal"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've had ${count} goal${pluralize(count)} assigned by the Zenomancer.`
          : `This player has had ${count} goal${pluralize(count)} assigned by the Zenomancer.`)
        : `Have a goal assigned by the Zenomancer.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has had a goal assigned by the Zenomancer at least ${times(count)}.`
        : `No player has had a goal assigned by the Zenomancer yet.`,
  },
  {
    id: "zenomancer_goals_completed_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["zenomancer"],
    scope: "affected_player",
    script: "npc",
    source: "grimoire_event",
    label: "Destiny Fulfilled",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "zenomancer" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Goal Completed"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've completed ${count} goal${pluralize(count)} from the Zenomancer.`
          : `This player has completed ${count} goal${pluralize(count)} from the Zenomancer.`)
        : `Complete a goal from the Zenomancer.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has completed a Zenomancer goal at least ${times(count)}.`
        : `No player has completed a Zenomancer goal yet.`,
  },
];
