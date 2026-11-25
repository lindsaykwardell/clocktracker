import {
  GameEndTrigger,
  GameEndTriggerCause,
  GrimoireEventType,
} from "~/composables/useGames";
import type { GameRecord } from "~/composables/useGames";
import { isEmptySeat } from "~/composables/grimoireParticipantMatching";
import {
  getByRoleForEvent,
  getEventCurrentToken,
  getMostCommonByRole,
  getMostCommonByRoleSubtitle,
  getMostCommonEndTriggerRole,
  getMostCommonEndTriggerRoleSubtitle,
  isDemonKillEvent,
  pluralize,
  rolePrefix,
  times,
} from "./shared";
import type { RoleStatCardDefinition, RoleStatCardDisplayRole } from "./shared";

type GameEvent = GameRecord["grimoire_events"][number];
type SeatToken = GameRecord["grimoire"][number]["tokens"][number];
type EventPredicate = (game: GameRecord, event: GameEvent) => boolean;

const hasBeen = (isMe: boolean) => (isMe ? "You've been" : "This player has been");

function displayRole(role: SeatToken["role"] | null | undefined): RoleStatCardDisplayRole | null {
  if (!role?.id || !role.name || !role.token_url || !role.type || !role.initial_alignment) {
    return null;
  }
  return {
    id: role.id,
    name: role.name,
    token_url: role.token_url,
    type: role.type,
    initial_alignment: role.initial_alignment,
  };
}

/** The role that shows up most often in the list. */
function mostCommonRole(roles: (SeatToken["role"] | null | undefined)[]) {
  const counts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();
  for (const role of roles) {
    const display = displayRole(role);
    if (!display) continue;
    const entry = counts.get(display.id) ?? { role: display, count: 0 };
    entry.count += 1;
    counts.set(display.id, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.role ?? null;
}

/**
 * A Traveller who joined after the first page or left before the last: their
 * seat is empty (no name, character or account) on that page, or isn't there.
 * The seat is followed by its participant id, so a seat that only got linked
 * to the account later doesn't count.
 */
function travellerVisit(game: GameRecord, username?: string) {
  const none = { joined: null, left: null } as {
    joined: SeatToken["role"] | null;
    left: SeatToken["role"] | null;
  };
  const pages = game.grimoire;
  if (!username || game.ignore_for_stats || pages.length < 2) return none;

  const seats = pages.map(
    (page) => page.tokens.find((token) => token.player?.username === username) ?? null
  );
  const first = seats.findIndex(Boolean);
  if (first < 0) return none;
  let last = seats.length - 1;
  while (!seats[last]) last -= 1;

  const participantId = seats[first]!.grimoire_participant_id;
  if (!participantId) return none;
  const goneOn = (pageIndex: number) => {
    const seat = pages[pageIndex].tokens.find(
      (token) => token.grimoire_participant_id === participantId
    );
    return !seat || isEmptySeat(seat);
  };
  const isTraveller = (seat: SeatToken | null) => seat?.role?.type === "TRAVELER";

  return {
    joined: first > 0 && isTraveller(seats[first]) && goneOn(0) ? seats[first]!.role : null,
    left:
      last < pages.length - 1 && isTraveller(seats[last]) && goneOn(pages.length - 1)
        ? seats[last]!.role
        : null,
  };
}

const ofType = (type: GrimoireEventType): EventPredicate => (_game, event) =>
  event.event_type === type;

function countEvents(games: GameRecord[], predicate: EventPredicate) {
  return games.reduce(
    (total, game) =>
      game.ignore_for_stats
        ? total
        : total + game.grimoire_events.filter((event) => predicate(game, event)).length,
    0
  );
}

/** "Most often by the Poisoner": the character that did it to this player. */
function mostOftenBySubtitle(games: GameRecord[], predicate: EventPredicate) {
  const top = getMostCommonByRole(games, predicate);
  return top ? `Most often by ${rolePrefix(top.name)}` : null;
}

/** The character this player had when it happened to them. */
function rolesAtEvent(games: GameRecord[], predicate: EventPredicate) {
  return games.flatMap((game) =>
    game.ignore_for_stats
      ? []
      : game.grimoire_events
          .filter((event) => predicate(game, event))
          .map((event) => getEventCurrentToken(game, event)?.role)
  );
}

/** Games where this player was the Drunk (on any page). */
function drunkRoles(games: GameRecord[], username?: string) {
  if (!username) return [];
  return games.flatMap((game) => {
    if (game.ignore_for_stats) return [];
    for (const page of game.grimoire) {
      const seat = page.tokens.find(
        (token) => token.player?.username === username && token.role_id === "drunk"
      );
      if (seat) return [seat.role];
    }
    return [];
  });
}

/** Made drunk by an ability, and being the Drunk, as the characters behind it. */
function drunkSources(games: GameRecord[], username?: string) {
  const byAbility = games.flatMap((game) =>
    game.ignore_for_stats
      ? []
      : game.grimoire_events
          .filter((event) => event.event_type === GrimoireEventType.DRUNK)
          .map((event) => getByRoleForEvent(game, event))
  );
  return [...byAbility, ...drunkRoles(games, username)];
}

/**
 * A game this player's ability ended ("Look What I Can Do!"): a Slayer's shot,
 * a Saint or Vortox win, an Assassin killing down to two. A Demon's ordinary
 * night kill down to two players is its basic job, so it doesn't count; a
 * Demon ending the game another way (Vortox, Leviathan) does.
 */
function endedByNotableAbility(game: {
  end_trigger: string;
  end_trigger_cause?: string | null;
  end_trigger_role?: { type?: string | null } | null;
}) {
  if (game.end_trigger === GameEndTrigger.NOT_RECORDED) return false;
  if (game.end_trigger_cause !== GameEndTriggerCause.ABILITY) return false;
  return !(
    game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
    game.end_trigger_role?.type === "DEMON"
  );
}

export const GENERAL_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  // What this player did: ended the game, caught or played the Demon.
  {
    id: "game_ending_abilities",
    category: "general",
    source: "end_trigger",
    label: "Look What I Can Do!",
    getCount: ({ games }) =>
      games.filter((game) => !game.ignore_for_stats && endedByNotableAbility(game)).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "You have" : "This player has"} ended ${count} game${pluralize(count)} with ${isMe ? "your" : "their"} ability.`
        : `End a game with your ability.`,
    getSubtitle: ({ games }) =>
      getMostCommonEndTriggerRoleSubtitle(games, endedByNotableAbility),
    getDisplayRole: ({ games }) =>
      getMostCommonEndTriggerRole(games, endedByNotableAbility),
  },
  {
    id: "nominated_and_killed_demon",
    category: "general",
    source: "end_trigger",
    label: "Caught Red-Handed",
    getCount: ({ games }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_cause === GameEndTriggerCause.NOMINATION
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "You have" : "This player has"} nominated and executed the demon ${times(count)}.`
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
    id: "demon_kills_total",
    category: "general",
    source: "grimoire_event",
    label: "Things That Go Bump",
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
        ? (isMe
          ? `As a demon, you've killed ${count} player${pluralize(count)}.`
          : `As a demon, this player has killed ${count} player${pluralize(count)}.`)
        : `As the demon, kill a player.`,
    getSubtitle: ({ games }) => getMostCommonByRoleSubtitle(games, isDemonKillEvent),
    getDisplayRole: ({ games }) => getMostCommonByRole(games, isDemonKillEvent),
  },
  {
    id: "demon_kills_minions",
    category: "general",
    source: "grimoire_event",
    label: "Infernal Restructuring",
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

  // What happened to this player (scope "affected_player": the events on
  // their own seat), in the same order where they mirror the cards above:
  // killed by the Demon, executed, then the abilities that act on a player.
  {
    id: "killed_by_demon",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "Night Terrors",
    getCount: ({ games }) => countEvents(games, isDemonKillEvent),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "You've" : "This player has"} been killed by the Demon ${times(count)}.`
        : `Be killed by the Demon.`,
    getSubtitle: ({ games }) => mostOftenBySubtitle(games, isDemonKillEvent),
    getDisplayRole: ({ games }) => getMostCommonByRole(games, isDemonKillEvent),
  },
  {
    id: "executed_total",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "Heads Must Roll",
    getCount: ({ games }) => countEvents(games, ofType(GrimoireEventType.EXECUTION)),
    getSentence: ({ count, isMe }) =>
      count > 0 ? `${hasBeen(isMe)} executed ${times(count)}.` : `Be executed.`,
    getSubtitle: ({ games }) => {
      const top = mostCommonRole(rolesAtEvent(games, ofType(GrimoireEventType.EXECUTION)));
      return top ? `Most often as ${rolePrefix(top.name)}` : null;
    },
    getDisplayRole: ({ games }) =>
      mostCommonRole(rolesAtEvent(games, ofType(GrimoireEventType.EXECUTION))),
  },
  {
    id: "poisoned_total",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "Something in the Water",
    getCount: ({ games }) => countEvents(games, ofType(GrimoireEventType.POISONED)),
    getSentence: ({ count, isMe }) =>
      count > 0 ? `${hasBeen(isMe)} poisoned ${times(count)}.` : `Be poisoned.`,
    getSubtitle: ({ games }) =>
      mostOftenBySubtitle(games, ofType(GrimoireEventType.POISONED)),
    getDisplayRole: ({ games }) =>
      getMostCommonByRole(games, ofType(GrimoireEventType.POISONED)),
  },
  {
    // Made drunk by an ability, plus every game this player was the Drunk.
    id: "drunk_total",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "One Too Many",
    getCount: ({ games, username }) =>
      countEvents(games, ofType(GrimoireEventType.DRUNK)) + drunkRoles(games, username).length,
    getSentence: ({ games, count, isMe, username }) => {
      if (count === 0) return `Be made drunk, or be the Drunk.`;
      const asDrunk = drunkRoles(games, username).length;
      if (asDrunk === 0) return `${hasBeen(isMe)} drunk ${times(count)}.`;
      if (asDrunk === count) {
        return `${hasBeen(isMe)} the Drunk in ${count} game${pluralize(count)}.`;
      }
      return `${hasBeen(isMe)} drunk ${times(count)}, including ${asDrunk} game${pluralize(asDrunk)} as the Drunk.`;
    },
    getSubtitle: ({ games, username }) => {
      const top = mostCommonRole(drunkSources(games, username));
      if (!top) return null;
      return top.id === "drunk" ? "Most often as the Drunk" : `Most often by ${rolePrefix(top.name)}`;
    },
    getDisplayRole: ({ games, username }) => mostCommonRole(drunkSources(games, username)),
  },
  {
    id: "mad_total",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "Not All There",
    getCount: ({ games }) => countEvents(games, ofType(GrimoireEventType.MAD)),
    getSentence: ({ count, isMe }) =>
      count > 0 ? `${hasBeen(isMe)} made mad ${times(count)}.` : `Be made mad.`,
    getSubtitle: ({ games }) => mostOftenBySubtitle(games, ofType(GrimoireEventType.MAD)),
    getDisplayRole: ({ games }) => getMostCommonByRole(games, ofType(GrimoireEventType.MAD)),
  },
  {
    id: "character_changed",
    category: "general",
    scope: "affected_player",
    source: "grimoire_event",
    label: "Who Am I Now?",
    getCount: ({ games }) => countEvents(games, ofType(GrimoireEventType.ROLE_CHANGE)),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "Your" : "This player's"} character has been changed ${times(count)}.`
        : `Be changed into a different character.`,
    getSubtitle: ({ games }) =>
      mostOftenBySubtitle(games, ofType(GrimoireEventType.ROLE_CHANGE)),
    getDisplayRole: ({ games }) =>
      getMostCommonByRole(games, ofType(GrimoireEventType.ROLE_CHANGE)),
  },

  // Travellers coming and going.
  {
    id: "traveller_joined_late",
    category: "general",
    scope: "affected_player",
    source: "grimoire_state",
    label: "Fashionably Late",
    getCount: ({ games, username }) =>
      games.filter((game) => travellerVisit(game, username).joined).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "You've" : "This player has"} joined ${count} game${pluralize(count)} as a Traveller after the first page.`
        : `Join a game as a Traveller after it has started.`,
    getSubtitle: ({ games, username }) => {
      const top = mostCommonRole(games.map((game) => travellerVisit(game, username).joined));
      return top ? `Most often as ${rolePrefix(top.name)}` : null;
    },
    getDisplayRole: ({ games, username }) =>
      mostCommonRole(games.map((game) => travellerVisit(game, username).joined)),
  },
  {
    id: "traveller_left_early",
    category: "general",
    scope: "affected_player",
    source: "grimoire_state",
    label: "Leaving So Soon?",
    getCount: ({ games, username }) =>
      games.filter((game) => travellerVisit(game, username).left).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? `${isMe ? "You've" : "This player has"} left ${count} game${pluralize(count)} early as a Traveller.`
        : `Leave a game early as a Traveller.`,
    getSubtitle: ({ games, username }) => {
      const top = mostCommonRole(games.map((game) => travellerVisit(game, username).left));
      return top ? `Most often as ${rolePrefix(top.name)}` : null;
    },
    getDisplayRole: ({ games, username }) =>
      mostCommonRole(games.map((game) => travellerVisit(game, username).left)),
  },
];
