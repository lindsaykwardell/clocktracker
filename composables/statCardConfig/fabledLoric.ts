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

export const FABLEDLORIC_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "angel_deaths",
    category: "role",
    roleIds: ["angel"],
    script: "npc",
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
      count > 0
        ? `${isMe ? "You've" : "This player has"} been struck down by the Angel ${count} time${pluralize(count)}.`
        : `Be struck down by the Angel.`,
  },
  // Angel: @todo Protected?
  // Buddhist: Nothing to track really.
  {
    id: "doomsayer_deaths",
    category: "role",
    roleIds: ["doomsayer"],
    script: "npc",
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
      count > 0
        ? `${isMe ? "You've" : "This player has"} died to the Doomsayer ${count} time${pluralize(count)}.`
        : `Die to the Doomsayer.`,
  },
  {
    id: "hells_librarian_deaths",
    category: "role",
    roleIds: ["hells_librarian"],
    script: "npc",
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
      count > 0
        ? `${isMe ? "Hell's Librarian has" : "Hell's Librarian has"} fined ${isMe ? "you" : "this player"} with death ${count} time${pluralize(count)}.`
        : `Die due to Hell's Librarian.`,
  },
  // Fiddler: @todo
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
    roleIds: ["big_wig"],
    script: "npc",
    source: "grimoire_event",
    label: "Off With Their Head",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.by_role_id === "bigwig" &&
          event.event_type === GrimoireEventType.DEATH &&
          event.status_source === "DEAD"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've died due to the Big Wig ${count} time${pluralize(count)}.`
          : `This player has died due to the Big Wig ${count} time${pluralize(count)}.`)
        : `Die due to the Big Wig.`,
  },
  // Bootlegger: Too complex
  // Gardener: Nothing to track really.
  {
    id: "hindu_revives",
    category: "role",
    roleIds: ["hindu"],
    script: "npc",
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
      count > 0
        ? `${isMe ? "You've" : "This player has"} been brought back as a Traveller by the Hindu ${count} time${pluralize(count)}.`
        : `Be brought back as a Traveller by the Hindu.`,
  },
  // Pope: Nothing to track really.
  {
    id: "storm_catcher_protected_received",
    category: "role",
    roleIds: ["storm_catcher"],
    script: "npc",
    source: "grimoire_event",
    label: "Eye of the Storm",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.by_role_id === "stormcatcher" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Stormcaught"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been protected by the Storm Catcher ${count} time${pluralize(count)}.`
          : `This player has been protected by the Storm Catcher ${count} time${pluralize(count)}.`)
        : `Be protected by the Storm Catcher.`,
  },
  // Tor: Nothing to track really.
  // Ventriloquist: @todo ?
  {
    id: "zenomancer_goals_assigned_received",
    category: "role",
    roleIds: ["zenomancer"],
    script: "npc",
    source: "grimoire_event",
    label: "Threads of Fate",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
  },
  {
    id: "zenomancer_goals_completed_received",
    category: "role",
    roleIds: ["zenomancer"],
    script: "npc",
    source: "grimoire_event",
    label: "Destiny Fulfilled",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
  },
];
