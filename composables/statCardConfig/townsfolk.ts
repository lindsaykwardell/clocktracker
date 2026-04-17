import {
  GameEndTrigger,
  GameEndTriggerCause,
  GrimoireEventType,
  WinStatus_V2,
} from "~/composables/useGames";
import { parseEndTriggerSubtype } from "~/composables/endTriggerSubtypeConfig";
import {
  countMatchingEvents,
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
  wasWere,
} from "./shared";
import type { RoleStatCardDefinition, RoleStatCardDisplayRole } from "./shared";

function getWasherwomanMostShownRole(
  games: Parameters<RoleStatCardDefinition["getCount"]>[0]["games"],
  roleId: string | null | undefined
): { role: RoleStatCardDisplayRole | null; count: number } {
  if (!roleId) return { role: null, count: 0 };

  const roleCounts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    for (const event of game.grimoire_events) {
      if (
        event.by_role_id !== roleId ||
        event.event_type !== GrimoireEventType.OTHER ||
        event.status_source !== "Townsfolk"
      ) {
        continue;
      }

      const token = getEventCurrentToken(game, event) ?? getEventPreviousToken(game, event);
      const role = token?.role;
      if (!role?.id || !role.name || !role.token_url || !role.type || !role.initial_alignment) {
        continue;
      }

      const existing = roleCounts.get(role.id) ?? {
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
      roleCounts.set(role.id, existing);
    }
  }

  const top = Array.from(roleCounts.values()).sort(
    (a, b) => b.count - a.count || a.role.id.localeCompare(b.role.id)
  )[0];

  return top ? { role: top.role, count: top.count } : { role: null, count: 0 };
}

function getMostShownRoleByStatusSource(
  games: Parameters<RoleStatCardDefinition["getCount"]>[0]["games"],
  roleId: string | null | undefined,
  statusSource: string
): { role: RoleStatCardDisplayRole | null; count: number } {
  if (!roleId) return { role: null, count: 0 };

  const roleCounts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    for (const event of game.grimoire_events) {
      if (
        event.by_role_id !== roleId ||
        event.event_type !== GrimoireEventType.OTHER ||
        event.status_source !== statusSource
      ) {
        continue;
      }

      const token = getEventCurrentToken(game, event) ?? getEventPreviousToken(game, event);
      const role = token?.role;
      if (!role?.id || !role.name || !role.token_url || !role.type || !role.initial_alignment) {
        continue;
      }

      const existing = roleCounts.get(role.id) ?? {
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
      roleCounts.set(role.id, existing);
    }
  }

  const top = Array.from(roleCounts.values()).sort(
    (a, b) => b.count - a.count || a.role.id.localeCompare(b.role.id)
  )[0];

  return top ? { role: top.role, count: top.count } : { role: null, count: 0 };
}

function getFinalAlignmentForUsername(
  game: Parameters<RoleStatCardDefinition["getCount"]>[0]["games"][number],
  username: string | undefined
) {
  // Match game-card behavior first: use the final "player_characters" state.
  // This is the canonical source for non-grimoire games.
  const lastCharacter = game.player_characters.at(-1);
  if (lastCharacter?.alignment) return lastCharacter.alignment;

  if (!username || game.grimoire.length === 0) return null;

  const lastPage = game.grimoire[game.grimoire.length - 1];
  const tokenOnLastPage = lastPage?.tokens.find(
    (token) => token.player?.username === username && !!token.alignment
  );
  if (tokenOnLastPage?.alignment) return tokenOnLastPage.alignment;

  for (let pageIndex = game.grimoire.length - 1; pageIndex >= 0; pageIndex--) {
    const token = game.grimoire[pageIndex]?.tokens.find(
      (candidate) => candidate.player?.username === username && !!candidate.alignment
    );
    if (token?.alignment) return token.alignment;
  }

  return null;
}

export const TOWNSFOLK_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "acrobat_self_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["acrobat"],
    script: "experimental",
    source: "grimoire_event",
    label: "Fatal Stunts",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Acrobat, you've died ${count} time${pluralize(count)} by picking a drunk or poisoned player.`
          : `As the Acrobat, this player has died ${count} time${pluralize(count)} by picking a drunk or poisoned player.`)
        : `As the Acrobat, die by picking a drunk or poisoned player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Acrobat has died from picking a drunk or poisoned player at least ${count} time${pluralize(count)}.`
        : `No Acrobat has died from picking a drunk or poisoned player yet.`,
  },
  // Alchemist: Too complex
  {
    id: "alsaahir_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["alsaahir"],
    script: "experimental",
    source: "end_trigger",
    label: "Last Draw",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Alsaahir, you've ended ${count} game${pluralize(count)} by guessing correctly.`
          : `As the Alsaahir, this player has ended ${count} game${pluralize(count)} by guessing correctly.`)
        : `As the Alsaahir, end a game by guessing correctly.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by an Alsaahir guessing correctly.`
        : `No Alsaahir has ended a game by guessing correctly yet.`,
  },
  {
    id: "amnesiac_ability_guesses",
    category: "role",
    scope: "as_role",
    roleIds: ["amnesiac"],
    script: "experimental",
    source: "grimoire_event",
    label: "That's a Bingo!",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Bingo"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Amnesiac, you've correctly identified your ability ${count} time${pluralize(count)}.`
          : `As the Amnesiac, this player has correctly identified their ability ${count} time${pluralize(count)}.`)
        : `As the Amnesiac, correctly identify your ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Amnesiac has correctly identified their ability at least ${count} time${pluralize(count)}.`
        : `No Amnesiac has correctly identified their ability yet.`,
  },
  {
    id: "artist_ability_uses",
    category: "role",
    scope: "as_role",
    roleIds: ["artist"],
    script: "snv",
    sao: 11,
    source: "grimoire_event",
    label: "Single Stroke",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Artist, you've asked the Storyteller a question ${count} time${pluralize(count)}.`
          : `As the Artist, this player has asked the Storyteller a question ${count} time${pluralize(count)}.`)
        : `As the Artist, ask the Storyteller a question.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Artist has asked the Storyteller a question at least ${count} time${pluralize(count)}.`
        : `No Artist has asked the Storyteller a question yet.`,
  },
  {
    id: "atheist_storyteller_executions",
    category: "role",
    scope: "as_role",
    roleIds: ["atheist"],
    script: "experimental",
    source: "end_trigger",
    label: "No Gods, No Masters",
    getCount: ({ games, roleId }) =>
      games.filter((game) => {
        if (
          game.ignore_for_stats ||
          !roleId ||
          game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
          game.end_trigger_cause !== GameEndTriggerCause.ABILITY ||
          game.end_trigger_role_id !== roleId
        ) {
          return false;
        }

        const subtype =
          parseEndTriggerSubtype(game.end_trigger_subtype) ??
          parseEndTriggerSubtype(game.end_trigger_note);
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_ATHEIST_IN_PLAY") return true;
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_NO_ATHEIST_IN_PLAY") return false;

        // Backward compatibility for older subtype values.
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_GOOD_WINS") return true;
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_GOOD_LOSES") return false;

        // Legacy records without subtype: keep counting as unknown Storyteller execution.
        return true;
      }).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Atheist, you've caused ${count} game${pluralize(count)} to end when the Storyteller was executed.`
          : `As the Atheist, this player has caused ${count} game${pluralize(count)} to end when the Storyteller was executed.`)
        : `As the Atheist, cause a game to end when the Storyteller is executed.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended when the Storyteller was executed with an Atheist in play.`
        : `No Atheist game has ended when the Storyteller was executed yet.`,
  },
  {
    id: "atheist_storyteller_executions_no_atheist_received",
    category: "role",
    scope: "affected_player",
    roleIds: ["atheist"],
    script: "experimental",
    source: "end_trigger",
    label: "Faith Misplaced",
    getCount: ({ games }) =>
      games.filter((game) => {
        if (
          game.ignore_for_stats ||
          game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
          game.end_trigger_cause !== GameEndTriggerCause.ABILITY
        ) {
          return false;
        }

        const subtype =
          parseEndTriggerSubtype(game.end_trigger_subtype) ??
          parseEndTriggerSubtype(game.end_trigger_note);
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_NO_ATHEIST_IN_PLAY") return true;

        // Backward compatibility for older subtype values.
        return subtype === "ATHEIST_STORYTELLER_EXECUTED_GOOD_LOSES";
      }).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've had ${count} game${pluralize(count)} end when the Storyteller was executed while no Atheist was in play.`
          : `This player has had ${count} game${pluralize(count)} end when the Storyteller was executed while no Atheist was in play.`)
        : `Have a game end when the Storyteller is executed while no Atheist is in play.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended when the Storyteller was executed with no Atheist in play.`
        : `No game has ended when the Storyteller was executed with no Atheist in play yet.`,
    getSubtitle: ({ games, isMe, username }) => {
      const matchingGames = games.filter((game) => {
        if (
          game.ignore_for_stats ||
          game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
          game.end_trigger_cause !== GameEndTriggerCause.ABILITY
        ) {
          return false;
        }

        const subtype =
          parseEndTriggerSubtype(game.end_trigger_subtype) ??
          parseEndTriggerSubtype(game.end_trigger_note);
        if (subtype === "ATHEIST_STORYTELLER_EXECUTED_NO_ATHEIST_IN_PLAY") return true;

        return subtype === "ATHEIST_STORYTELLER_EXECUTED_GOOD_LOSES";
      });

      if (matchingGames.length === 0) return null;

      const recordedGames = matchingGames.filter(
        (game) => game.win_v2 !== WinStatus_V2.NOT_RECORDED
      );

      const wins = recordedGames.filter((game) => {
        if (game.win_v2 === WinStatus_V2.NOT_RECORDED) return false;

        const alignment = getFinalAlignmentForUsername(game, username);
        if (alignment === "GOOD") return game.win_v2 === WinStatus_V2.GOOD_WINS;
        if (alignment === "EVIL") return game.win_v2 === WinStatus_V2.EVIL_WINS;
        return false;
      }).length;

      return `${isMe ? "You've" : "This player has"} won ${wins} of ${recordedGames.length} recorded results.`;
    },
  },
  {
    id: "balloonist_demon_learns",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["balloonist"],
    source: "grimoire_event",
    label: "Hell Below",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Know"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);
            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Balloonist, you've learned the Demon ${count} time${pluralize(count)}.`
          : `As the Balloonist, this player has learned the Demon ${count} time${pluralize(count)}.`)
        : `As the Balloonist, learn the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Balloonist has learned the Demon at least ${count} time${pluralize(count)}.`
        : `No Balloonist has learned the Demon yet.`,
  },
  {
    id: "balloonist_full_type_sweeps",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["balloonist"],
    source: "grimoire_event",
    label: "High Vantage",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        const learnedTypes = new Set<string>();
        for (const event of game.grimoire_events) {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.OTHER ||
            event.status_source !== "Know"
          ) {
            continue;
          }

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);
          const learnedType = currentToken?.role?.type ?? previousToken?.role?.type;
          if (learnedType) learnedTypes.add(learnedType);
        }

        return learnedTypes.has("TOWNSFOLK") &&
          learnedTypes.has("OUTSIDER") &&
          learnedTypes.has("MINION") &&
          learnedTypes.has("DEMON")
          ? total + 1
          : total;
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Balloonist, you've learned all 4 character types in ${count} game${pluralize(count)}.`
          : `As the Balloonist, this player has learned all 4 character types in ${count} game${pluralize(count)}.`)
        : `As the Balloonist, learn all 4 character types in a single game.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Balloonist has learned all 4 character types in at least ${count} game${pluralize(count)}.`
        : `No Balloonist has learned all 4 character types in a single game yet.`,
  },
  {
    id: "banshee_awakenings",
    category: "role",
    scope: "as_role",
    roleIds: ["banshee"],
    script: "experimental",
    source: "grimoire_event",
    label: "Awakened Fury",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Has Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Banshee, you've been awakened ${count} time${pluralize(count)}.`
          : `As the Banshee, this player has been awakened ${count} time${pluralize(count)}.`)
        : `As the Banshee, be awakened.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Banshee has been awakened at least ${count} time${pluralize(count)}.`
        : `No Banshee has been awakened yet.`,
  },
  {
    id: "bounty_hunter_townsfolk_turned_evil",
    category: "role",
    scope: "as_role",
    roleIds: ["bounty_hunter"],
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Bounty Hunter, you've turned ${count} Townsfolk evil.`
          : `As the Bounty Hunter, this player has turned ${count} Townsfolk evil.`)
        : `As the Bounty Hunter, turn a Townsfolk evil.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Townsfolk ${wasWere(count)} turned evil by a Bounty Hunter.`
        : `No Bounty Hunter has turned a Townsfolk evil yet.`,
  },
  {
    id: "bounty_hunter_evil_executions",
    category: "role",
    scope: "as_role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Bounty Hunter, you've nominated and executed ${count} evil player${pluralize(count)}.`
          : `As the Bounty Hunter, this player has nominated and executed ${count} evil player${pluralize(count)}.`)
        : `As the Bounty Hunter, nominate and execute an evil player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} evil player${pluralize(count)} ${wasWere(count)} nominated and executed by a Bounty Hunter.`
        : `No Bounty Hunter has nominated and executed an evil player yet.`,
  },
  {
    id: "bounty_hunter_alignment_changes_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["bounty_hunter"],
    source: "grimoire_event",
    label: "I Was Framed",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
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
      count > 0
        ? (isMe
          ? `You've turned evil ${count} time${pluralize(count)} due to the Bounty Hunter.`
          : `This player has turned evil ${count} time${pluralize(count)} due to the Bounty Hunter.`)
        : `Turn evil due to the Bounty Hunter.`,
  },
  {
    id: "cannibal_good_lunches",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["cannibal"],
    source: "grimoire_event",
    label: "Wholesome Lunch",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Lunch"
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
      count > 0
        ? (isMe
          ? `As the Cannibal, you've eaten ${count} good player${pluralize(count)}.`
          : `As the Cannibal, this player has eaten ${count} good player${pluralize(count)}.`)
        : `As the Cannibal, eat a good player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} good player${pluralize(count)} ${wasWere(count)} eaten by a Cannibal.`
        : `No Cannibal has eaten a good player yet.`,
  },
  {
    id: "cannibal_evil_lunches",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["cannibal"],
    source: "grimoire_event",
    label: "Indigestion",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.POISONED),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cannibal, you've been poisoned ${count} time${pluralize(count)} from eating an evil player.`
          : `As the Cannibal, this player has been poisoned ${count} time${pluralize(count)} from eating an evil player.`)
        : `As the Cannibal, become poisoned by eating an evil player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Cannibal has been poisoned from eating an evil player at least ${count} time${pluralize(count)}.`
        : `No Cannibal has been poisoned from eating an evil player yet.`,
  },
  // Chambermaid [sao: 3]: Nothing relevant. Only option: Highest number received, Or highest number of players checked in one game?
  // Chef [sao: 4]: @todo: Would have been cool to track highest number somehow. but I don't want to add 1-18 reminder tokens (which is the highest it can get according to Reddit).
  {
    id: "choirboy_demon_reveals",
    category: "role",
    scope: "as_role",
    roleIds: ["choirboy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Funeral Hymn",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              (event.status_source !== "Know" &&
                event.status_source !== "Demon")
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Choirboy, you've learned the Demon when the King was killed ${count} time${pluralize(count)}.`
          : `As the Choirboy, this player has learned the Demon when the King was killed ${count} time${pluralize(count)}.`)
        : `As the Choirboy, learn the Demon when the King is killed.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Choirboy has learned the Demon when the King was killed at least ${count} time${pluralize(count)}.`
        : `No Choirboy has learned the Demon when the King was killed yet.`,
  },
  {
    id: "choirboy_demon_reveals_received",
    category: "role",
    roleIds: ["choirboy"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Royal Suspect",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (
          event.by_role_id !== "choirboy" ||
          event.event_type !== GrimoireEventType.OTHER ||
          (event.status_source !== "Know" &&
            event.status_source !== "Demon")
        ) {
          return false;
        }

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);

        return (
          currentToken?.role?.type === "DEMON" ||
          previousToken?.role?.type === "DEMON"
        );
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been shown correctly as the Demon to the Choirboy ${count} time${pluralize(count)}.`
          : `This player has been shown correctly as the Demon to the Choirboy ${count} time${pluralize(count)}.`)
        : `Be shown correctly as the Demon to the Choirboy after you kill the King.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The Demon has been shown correctly to a Choirboy at least ${count} time${pluralize(count)}.`
        : `No Demon has been shown correctly to a Choirboy yet.`,
  },
  // Clockmaker [sao: 1]: Nothing relevant. Only option: Highest number received?
  {
    id: "courtier_drunk",
    category: "role",
    scope: "as_role",
    roleIds: ["courtier"],
    script: "bmr",
    sao: 8,
    source: "grimoire_event",
    label: "Sommelier's Choice",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Courtier, you've successfully chosen ${count} in-play character${pluralize(count)} and made them drunk.`
          : `As the Courtier, this player has successfully chosen ${count} in-play character${pluralize(count)} and made them drunk.`)
        : `As the Courtier, successfully choose an in-play character and make them drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} in-play character${pluralize(count)} ${wasWere(count)} made drunk by a Courtier.`
        : `No Courtier has made an in-play character drunk yet.`,
  },
  {
    id: "courtier_drunk_received",
    category: "role",
    roleIds: ["courtier"],
    scope: "affected_player",
    script: "bmr",
    sao: 8,
    source: "grimoire_event",
    label: "Three-Day Hangover",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "courtier"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've ended up drunk after being picked by the Courtier ${count} time${pluralize(count)}.`
          : `This player has ended up drunk after being picked by the Courtier ${count} time${pluralize(count)}.`)
        : `Become drunk due to being picked by the Courtier.`,
  },
  {
    id: "cult_leader_alignment_changes",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["cult_leader"],
    source: "grimoire_event",
    label: "Crisis of Faith",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cult Leader, you've changed alignment ${count} time${pluralize(count)}.`
          : `As the Cult Leader, this player has changed alignment ${count} time${pluralize(count)}.`)
        : `As the Cult Leader, change alignment.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Cult Leader has changed alignment at least ${count} time${pluralize(count)}.`
        : `No Cult Leader has changed alignment yet.`,
  },
  {
    id: "cult_leader_evil_cults",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["cult_leader"],
    source: "end_trigger",
    label: "Dark Congregation",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) => {
          if (
            game.ignore_for_stats ||
            !roleId ||
            game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
            game.end_trigger_cause !== GameEndTriggerCause.ABILITY ||
            game.end_trigger_role_id !== roleId
          ) {
            return false;
          }

          const lastPage = game.grimoire[game.grimoire.length - 1];
          const leaderToken = game.end_trigger_participant_id
            ? lastPage?.tokens.find(
                (token) =>
                  token.grimoire_participant_id === game.end_trigger_participant_id
              ) ?? null
            : null;

          if (leaderToken?.alignment) {
            return leaderToken.alignment === "EVIL";
          }

          // Fallback for legacy games without reliable end-trigger participant alignment.
          return game.win_v2 === WinStatus_V2.EVIL_WINS;
        }
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cult Leader, you've ended ${count} game${pluralize(count)} by forming an evil cult.`
          : `As the Cult Leader, this player has ended ${count} game${pluralize(count)} by forming an evil cult.`)
        : `As the Cult Leader, end a game by forming an evil cult.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Cult Leader forming an evil cult.`
        : `No Cult Leader has ended a game by forming an evil cult yet.`,
  },
  {
    id: "cult_leader_good_cults",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["cult_leader"],
    source: "end_trigger",
    label: "Holy Congregation",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) => {
          if (
            game.ignore_for_stats ||
            !roleId ||
            game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
            game.end_trigger_cause !== GameEndTriggerCause.ABILITY ||
            game.end_trigger_role_id !== roleId
          ) {
            return false;
          }

          const lastPage = game.grimoire[game.grimoire.length - 1];
          const leaderToken = game.end_trigger_participant_id
            ? lastPage?.tokens.find(
                (token) =>
                  token.grimoire_participant_id === game.end_trigger_participant_id
              ) ?? null
            : null;

          if (leaderToken?.alignment) {
            return leaderToken.alignment === "GOOD";
          }

          // Fallback for legacy games without reliable end-trigger participant alignment.
          return game.win_v2 === WinStatus_V2.GOOD_WINS;
        }
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cult Leader, you've ended ${count} game${pluralize(count)} by forming a good cult.`
          : `As the Cult Leader, this player has ended ${count} game${pluralize(count)} by forming a good cult.`)
        : `As the Cult Leader, end a game by forming a good cult.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Cult Leader forming a good cult.`
        : `No Cult Leader has ended a game by forming a good cult yet.`,
  },
  {
    id: "dreamer_demon_picks",
    category: "role",
    scope: "as_role",
    roleIds: ["dreamer"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Nightmare Fuel",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Chosen"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Dreamer, you've chosen the Demon ${count} time${pluralize(count)}.`
          : `As the Dreamer, this player has chosen the Demon ${count} time${pluralize(count)}.`)
        : `As the Dreamer, choose the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Dreamer has chosen the Demon at least ${count} time${pluralize(count)}.`
        : `No Dreamer has chosen the Demon yet.`,
  },
  // Empath [sao: 5]: @todo: Load grim and check first page for sitting next to two evils? Performance impact?
  {
    id: "engineer_uses",
    category: "role",
    scope: "as_role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Engineer, you've reassembled ${count} evil team${pluralize(count)}.`
          : `As the Engineer, this player has reassembled ${count} evil team${pluralize(count)}.`)
        : `As the Engineer, assemble a new evil team.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Engineer has reassembled at least ${count} evil team${pluralize(count)}.`
        : `No Engineer has reassembled an evil team yet.`,
  },
  {
    id: "exorcist_demon_picks",
    category: "role",
    scope: "as_role",
    roleIds: ["exorcist"],
    script: "bmr",
    sao: 4,
    source: "grimoire_event",
    label: "Evil Driven Out",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Chosen"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Exorcist, you've successfully chosen the Demon ${count} time${pluralize(count)}.`
          : `As the Exorcist, this player has successfully chosen the Demon ${count} time${pluralize(count)}.`)
        : `As the Exorcist, successfully choose the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Exorcist has successfully chosen the Demon at least ${count} time${pluralize(count)}.`
        : `No Exorcist has successfully chosen the Demon yet.`,
  },
  {
    id: "farmer_role_changes",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["farmer"],
    source: "grimoire_event",
    label: "Passing the Plough",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.ROLE_CHANGE ||
              !event.by_participant_id
            ) {
              return false;
            }

            const sourceToken =
              game.grimoire[event.grimoire_page]?.tokens.find(
                (token) =>
                  token.grimoire_participant_id === event.by_participant_id
              ) ??
              (event.grimoire_page > 0
                ? game.grimoire[event.grimoire_page - 1]?.tokens.find(
                    (token) =>
                      token.grimoire_participant_id === event.by_participant_id
                  )
                : null);

            return sourceToken?.player_id === game.user_id;
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Farmer, you've died and created another Farmer ${count} time${pluralize(count)}.`
          : `As the Farmer, this player has died and created another Farmer ${count} time${pluralize(count)}.`)
        : `As the Farmer, die and create another Farmer.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Farmer has died and created another Farmer at least ${count} time${pluralize(count)}.`
        : `No Farmer has died and created another Farmer yet.`,
  },
  {
    id: "fisherman_advice_used",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["fisherman"],
    source: "grimoire_event",
    label: "Gone Fishing",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fisherman, you've asked the Storyteller for advice ${count} time${pluralize(count)}.`
          : `As the Fisherman, this player has asked the Storyteller for advice ${count} time${pluralize(count)}.`)
        : `As the Fisherman, ask the Storyteller for advice.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Fisherman has asked the Storyteller for advice at least ${count} time${pluralize(count)}.`
        : `No Fisherman has asked the Storyteller for advice yet.`,
  },
  // Flowergirl [sao: 5]: Nothing relevant. Only option: How many times they got a yes?
  {
    id: "fool_saved_from_death",
    category: "role",
    scope: "as_role",
    roleIds: ["fool"],
    script: "bmr",
    sao: 13,
    source: "grimoire_event",
    label: "Not Today",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fool, you've avoided ${count} death${pluralize(count)}.`
          : `As the Fool, this player has avoided ${count} death${pluralize(count)}.`)
        : `As the Fool, survive death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Fool has avoided death at least ${count} time${pluralize(count)}.`
        : `No Fool has avoided death yet.`,
  },
  {
    id: "fortune_teller_demon",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 6,
    roleIds: ["fortune_teller"],
    source: "grimoire_event",
    label: "True Omen",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Yes"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fortune Teller, you've gotten a "Yes" on the Demon ${count} time${pluralize(count)}.`
          : `As the Fortune Teller, this player has gotten a "Yes" on the Demon ${count} time${pluralize(count)}.`)
        : `As the Fortune Teller, get a "Yes" on the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Fortune Teller has gotten a "Yes" on the Demon at least ${count} time${pluralize(count)}.`
        : `No Fortune Teller has gotten a "Yes" on the Demon yet.`,
  },
  {
    id: "fortune_teller_recluse",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 6,
    roleIds: ["fortune_teller"],
    source: "grimoire_event",
    label: "Misleading Glow",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Yes"
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
      count > 0
        ? (isMe
          ? `As the Fortune Teller, you've gotten a "Yes" on the Recluse ${count} time${pluralize(count)}.`
          : `As the Fortune Teller, this player has gotten a "Yes" on the Recluse ${count} time${pluralize(count)}.`)
        : `As the Fortune Teller, get a "Yes" on the Recluse.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has registered "Yes" to a Fortune Teller at least ${count} time${pluralize(count)}.`
        : `No Recluse has registered "Yes" to a Fortune Teller yet.`,
  },
  {
    id: "fortune_teller_red_herring_received",
    category: "role",
    scope: "affected_player",
    script: "tb",
    sao: 6,
    roleIds: ["fortune_teller"],
    source: "grimoire_event",
    label: "False Trail",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.OTHER &&
          event.by_role_id === "fortune_teller" &&
          event.status_source === "Red Herring"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been the Fortune Teller's red herring ${count} time${pluralize(count)}.`
          : `This player has been the Fortune Teller's red herring ${count} time${pluralize(count)}.`)
        : `Be the Fortune Teller's red herring.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been the Fortune Teller's red herring at least ${count} time${pluralize(count)}.`
        : `No player has been the Fortune Teller's red herring yet.`,
  },
  {
    id: "gambler_self_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["gambler"],
    script: "bmr",
    sao: 6,
    source: "grimoire_event",
    label: "Came Up Tails",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gambler, you've died ${count} time${pluralize(count)} by guessing a character wrong.`
          : `As the Gambler, this player has died ${count} time${pluralize(count)} by guessing a character wrong.`)
        : `As the Gambler, die by guessing a character wrong.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Gambler has died by guessing a character wrong at least ${count} time${pluralize(count)}.`
        : `No Gambler has died by guessing a character wrong yet.`,
  },
  // General: Nothing relevant. Only option: I don't know here. Which side you were shown most? Is that even interesting?
  {
    id: "gossip_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["gossip"],
    script: "bmr",
    sao: 7,
    source: "grimoire_event",
    label: "Loose Lips",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gossip, you've killed ${count} player${pluralize(count)}.`
          : `As the Gossip, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Gossip, make a statement that kills a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Gossip statement.`
        : `No Gossip statement has killed a player yet.`,
  },
  {
    id: "grandmother_ability_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["grandmother"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Shared Fate",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Grandmother, you've died ${count} time${pluralize(count)} after your grandchild was killed by the Demon.`
          : `As the Grandmother, this player has died ${count} time${pluralize(count)} after their grandchild was killed by the Demon.`)
        : `As the Grandmother, die when your grandchild is killed by the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Grandmother has died after their grandchild was killed by the Demon at least ${count} time${pluralize(count)}.`
        : `No Grandmother has died after their grandchild was killed by the Demon yet.`,
  },
  {
    id: "high_priestess_top_role",
    category: "role",
    visibility: "global",
    scope: "as_role",
    roleIds: ["high_priestess"],
    source: "grimoire_event",
    label: "Guided Path",
    getCount: ({ games, roleId }) =>
      getMostShownRoleByStatusSource(games, roleId, "Visit").count,
    getSentence: () => "This stat is only shown in global role stats.",
    getGlobalSentence: ({ games, roleId }) => {
      const top = getMostShownRoleByStatusSource(games, roleId, "Visit");
      if (!top.role || top.count === 0) {
        return "No High Priestess has been directed to a character yet.";
      }
      return `The character a High Priestess has most often been directed to, at least ${top.count} time${pluralize(top.count)}, is the ${top.role.name}.`;
    },
  },
  {
    id: "high_priestess_evil_visits",
    category: "role",
    scope: "as_role",
    roleIds: ["high_priestess"],
    script: "experimental",
    source: "grimoire_event",
    label: "Deceptive Intuition",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Visit"
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
          ? `As the High Priestess, you've been directed to an evil player ${count} time${pluralize(count)}.`
          : `As the High Priestess, this player has been directed to an evil player ${count} time${pluralize(count)}.`)
        : `As the High Priestess, be directed to an evil player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A High Priestess has been directed to an evil player at least ${count} time${pluralize(count)}.`
        : `No High Priestess has been directed to an evil player yet.`,
  },
  {
    id: "huntsman_ability_uses",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["huntsman"],
    source: "grimoire_event",
    label: "Rescue Attempt",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Huntsman, you've guessed ${count} player${pluralize(count)} as the Damsel.`
          : `As the Huntsman, this player has guessed ${count} player${pluralize(count)} as the Damsel.`)
        : `As the Huntsman, guess a player as the Damsel.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} guessed as the Damsel by a Huntsman.`
        : `No Huntsman has guessed a player as the Damsel yet.`,
  },
  {
    id: "huntsman_damsel_saves",
    category: "role",
    scope: "as_role",
    roleIds: ["huntsman"],
    script: "experimental",
    source: "grimoire_event",
    label: "Just in Time",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Huntsman, you've saved the Damsel ${count} time${pluralize(count)}.`
          : `As the Huntsman, this player has saved the Damsel ${count} time${pluralize(count)}.`)
        : `As the Huntsman, save the Damsel.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Huntsman has saved the Damsel at least ${count} time${pluralize(count)}.`
        : `No Huntsman has saved the Damsel yet.`,
  },
  // {
  //   id: "huntsman_wrong_choices",
  //   category: "role",
  //   scope: "as_role",
  //   script: "experimental",
  //   roleIds: ["huntsman"],
  //   source: "grimoire_event",
  //   label: "Off the Trail",
  //   getCount: ({ games, roleId }) =>
  //     games.reduce((total, game) => {
  //       if (!roleId || game.ignore_for_stats) return total;

  //       const abilityUses = game.grimoire_events.filter(
  //         (event) =>
  //           event.by_role_id === roleId &&
  //           event.event_type === GrimoireEventType.OTHER &&
  //           event.status_source === "No Ability"
  //       );

  //       const wrongChoices = abilityUses.filter((abilityUse) => {
  //         const successfulChoiceInSamePage = game.grimoire_events.some(
  //           (event) =>
  //             event.by_role_id === roleId &&
  //             event.event_type === GrimoireEventType.ROLE_CHANGE &&
  //             event.grimoire_page === abilityUse.grimoire_page
  //         );

  //         return !successfulChoiceInSamePage;
  //       }).length;

  //       return total + wrongChoices;
  //     }, 0),
  //   getSentence: ({ count, isMe }) =>
  //     count > 0
  //       ? (isMe
  //         ? `As the Huntsman, you've chosen the wrong player ${count} time${pluralize(count)}.`
  //         : `As the Huntsman, this player has chosen the wrong player ${count} time${pluralize(count)}.`)
  //       : `As the Huntsman, choose the wrong player.`,
  // },
  {
    id: "innkeeper_drunk_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["innkeeper"],
    script: "bmr",
    sao: 5,
    source: "grimoire_event",
    label: "House Special",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Innkeeper, you've made ${count} player${pluralize(count)} drunk.`
          : `As the Innkeeper, this player has made ${count} player${pluralize(count)} drunk.`)
        : `As the Innkeeper, make a player drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} made drunk by an Innkeeper.`
        : `No Innkeeper has made a player drunk yet.`,
  },
  {
    id: "innkeeper_drunk_received",
    category: "role",
    roleIds: ["innkeeper"],
    scope: "affected_player",
    script: "bmr",
    sao: 5,
    source: "grimoire_event",
    label: "Innkeeper's Pour",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "innkeeper"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been made drunk by the Innkeeper ${count} time${pluralize(count)}.`
          : `This player has been made drunk by the Innkeeper ${count} time${pluralize(count)}.`)
        : `Become drunk due to the Innkeeper.`,
  },
  {
    id: "innkeeper_saves",
    category: "role",
    scope: "as_role",
    roleIds: ["innkeeper"],
    script: "bmr",
    sao: 5,
    source: "grimoire_event",
    label: "Harbor in the Dark",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Saved"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Innkeeper, you've saved ${count} player${pluralize(count)} from death.`
          : `As the Innkeeper, this player has saved ${count} player${pluralize(count)} from death.`)
        : `As the Innkeeper, save a player from death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} saved from death by an Innkeeper.`
        : `No Innkeeper has saved a player from death yet.`,
  },
  {
    id: "investigator_top_role",
    category: "role",
    visibility: "global",
    scope: "as_role",
    roleIds: ["investigator"],
    source: "grimoire_event",
    label: "Early Suspicions",
    getCount: ({ games, roleId }) =>
      getMostShownRoleByStatusSource(games, roleId, "Minion").count,
    getSentence: () => "This stat is only shown in global role stats.",
    getGlobalSentence: ({ games, roleId }) => {
      const top = getMostShownRoleByStatusSource(games, roleId, "Minion");
      if (!top.role || top.count === 0) {
        return "No character has been shown as a Minion to an Investigator yet.";
      }
      return `The ${top.role.name} has been shown as a Minion to an Investigator at least ${top.count} time${pluralize(top.count)}, making it the most shown character.`;
    },
  },
  {
    id: "investigator_recluse",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 3,
    roleIds: ["investigator"],
    source: "grimoire_event",
    label: "False Lead",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Minion"
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
      count > 0
        ? (isMe
          ? `As the Investigator, you've seen the Recluse as a Minion ${count} time${pluralize(count)}.`
          : `As the Investigator, this player has seen the Recluse as a Minion ${count} time${pluralize(count)}.`)
        : `As the Investigator, see the Recluse as a Minion.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has been seen as a Minion by an Investigator at least ${count} time${pluralize(count)}.`
        : `No Recluse has been seen as a Minion by an Investigator yet.`,
  },
  {
    id: "juggler_correct",
    category: "role",
    scope: "as_role",
    roleIds: ["juggler"],
    script: "snv",
    sao: 12,
    source: "grimoire_event",
    label: "On the Mark",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source?.toLowerCase() === "correct"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Juggler, you've had ${count} correct juggle${pluralize(count)}.`
          : `As the Juggler, this player has had ${count} correct juggle${pluralize(count)}.`)
        : `As the Juggler, have a correct juggle.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Juggler has had at least ${count} correct juggle${pluralize(count)}.`
        : `No Juggler has had a correct juggle yet.`,
  },
  {
    id: "juggler_highest_correct_single_game",
    category: "role",
    scope: "as_role",
    roleIds: ["juggler"],
    script: "snv",
    sao: 12,
    source: "grimoire_event",
    label: "Showstopper",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let maxCorrectInSingleGame = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const correctInGame = game.grimoire_events.filter(
          (event) =>
            event.by_role_id === roleId &&
            event.event_type === GrimoireEventType.OTHER &&
            event.status_source?.toLowerCase() === "correct"
        ).length;

        if (correctInGame > maxCorrectInSingleGame) {
          maxCorrectInSingleGame = correctInGame;
        }
      }

      return maxCorrectInSingleGame > 1 ? maxCorrectInSingleGame : 0;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Juggler, your highest number of correct juggles in a single game is ${count}.`
          : `As the Juggler, this player's highest number of correct juggles in a single game is ${count}.`)
        : `As the Juggler, have multiple correct juggles in a single game.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The highest number of correct juggles by a Juggler in a single game is ${count}.`
        : `No Juggler has had multiple correct juggles in a single game yet.`,
  },
  // King: Nothing relevant. Only option: Highest number of characters learned in one game?
  // Knight: Nothing relevant. Only option: This players was shown to the knight. Is that interesting?
  {
    id: "librarian_top_role",
    category: "role",
    visibility: "global",
    scope: "as_role",
    roleIds: ["librarian"],
    source: "grimoire_event",
    label: "Catalog Trends",
    getCount: ({ games, roleId }) =>
      getMostShownRoleByStatusSource(games, roleId, "Outsider").count,
    getSentence: () => "This stat is only shown in global role stats.",
    getGlobalSentence: ({ games, roleId }) => {
      const top = getMostShownRoleByStatusSource(games, roleId, "Outsider");
      if (!top.role || top.count === 0) {
        return "No character has been shown as an Outsider to a Librarian yet.";
      }
      return `The ${top.role.name} has been shown as an Outsider to a Librarian at least ${top.count} time${pluralize(top.count)}, making it the most shown character.`;
    },
  },
  {
    id: "librarian_spy",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 2,
    roleIds: ["librarian"],
    source: "grimoire_event",
    label: "Membership Under Review",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Outsider"
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
          ? `As the Librarian, you've seen the Spy as an Outsider ${count} time${pluralize(count)}.`
          : `As the Librarian, this player has seen the Spy as an Outsider ${count} time${pluralize(count)}.`)
        : `As the Librarian, see the Spy as an Outsider.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as an Outsider by a Librarian at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as an Outsider by a Librarian yet.`,
  },
  {
    id: "lycanthrope_good_kills",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["lycanthrope"],
    source: "grimoire_event",
    label: "Moonlit Mauling",
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
      count > 0
        ? (isMe
          ? `As the Lycanthrope, you've killed ${count} good player${pluralize(count)}.`
          : `As the Lycanthrope, this player has killed ${count} good player${pluralize(count)}.`)
        : `As the Lycanthrope, kill a good player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} good player${pluralize(count)} ${wasWere(count)} killed by a Lycanthrope.`
        : `No Lycanthrope has killed a good player yet.`,
  },
  {
    id: "lycanthrope_spy_kills",
    category: "role",
    scope: "as_role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Lycanthrope, you've killed the Spy ${count} time${pluralize(count)}.`
          : `As the Lycanthrope, this player has killed the Spy ${count} time${pluralize(count)}.`)
        : `As the Lycanthrope, kill the Spy.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been killed by a Lycanthrope due to misregistering as Good at least ${count} time${pluralize(count)}.`
        : `No Spy has been killed by a Lycanthrope due to misregistering as Good yet.`,
  },
  // Magician: Nothing relevant. Only option: Can't think of anything..
  {
    id: "mathematician_highest_abnormal",
    category: "role",
    scope: "as_role",
    script: "snv",
    sao: 4,
    roleIds: ["mathematician"],
    source: "grimoire_event",
    label: "Statistical Anomaly",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let maxAbnormalLearned = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const abnormalByPage = new Map<number, number>();

        for (const event of game.grimoire_events) {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.OTHER ||
            event.status_source !== "Abnormal"
          ) {
            continue;
          }

          abnormalByPage.set(
            event.grimoire_page,
            (abnormalByPage.get(event.grimoire_page) ?? 0) + 1
          );
        }

        for (const count of abnormalByPage.values()) {
          if (count > maxAbnormalLearned) {
            maxAbnormalLearned = count;
          }
        }
      }

      return maxAbnormalLearned;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mathematician, your highest number of abnormal abilities learned is ${count}.`
          : `As the Mathematician, this player's highest number of abnormal abilities learned is ${count}.`)
        : `As the Mathematician, learn a number higher than 0.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The highest number of abnormal abilities learned by a Mathematician is ${count}.`
        : `No Mathematician has learned a number higher than 0 yet.`,
  },
  {
    id: "mayor_game_endings",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 13,
    roleIds: ["mayor"],
    source: "end_trigger",
    label: "Mayoral Mandate",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mayor, you've caused ${count} game${pluralize(count)} to end when no executions happened on the final day.`
          : `As the Mayor, this player has caused ${count} game${pluralize(count)} to end when no executions happened on the final day.`)
        : `As the Mayor, cause a game to end when no executions happen on the final day.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Mayor when no executions happened on the final day.`
        : `No Mayor has ended a game when no executions happened on the final day yet.`,
  },
  {
    id: "mayor_bounces",
    category: "role",
    scope: "as_role",
    script: "tb",
    roleIds: ["mayor"],
    source: "grimoire_event",
    label: "Mandate Extension",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Bounce"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mayor, you've caused ${count} death${pluralize(count)} to bounce to someone else.`
          : `As the Mayor, this player has caused ${count} death${pluralize(count)} to bounce to someone else.`)
        : `As the Mayor, have your death bounced to someone else.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} death${pluralize(count)} ${wasWere(count)} bounced to someone else by a Mayor.`
        : `No Mayor has bounced a death to someone else yet.`,
  },
  // Minstrel [sao: 10]: @todo
  {
    id: "monk_saves",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 8,
    roleIds: ["monk"],
    source: "grimoire_event",
    label: "Divine Protection",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Saved"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Monk, you've protected ${count} player${pluralize(count)} from the Demon.`
          : `As the Monk, this player has protected ${count} player${pluralize(count)} from the Demon.`)
        : `As the Monk, protect a player from the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} protected from the Demon by a Monk.`
        : `No Monk has protected a player from the Demon yet.`,
  },
  {
    id: "nightwatchman_ability_uses",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["nightwatchman"],
    source: "grimoire_event",
    label: "Nightly Patrol",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Chosen"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Nightwatchman, you've chosen ${count} player${pluralize(count)}.`
          : `As the Nightwatchman, this player has chosen ${count} player${pluralize(count)}.`)
        : `As the Nightwatchman, choose a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} chosen by a Nightwatchman.`
        : `No Nightwatchman has chosen a player yet.`,
  },
  {
    id: "nightwatchman_ability_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["nightwatchman"],
    source: "grimoire_event",
    label: "Midnight Visit",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "nightwatchman" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Chosen"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been visited by the Nightwatchman ${count} time${pluralize(count)}.`
          : `This player has been visited by the Nightwatchman ${count} time${pluralize(count)}.`)
        : `Be visited by the Nightwatchman at night.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been visited by a Nightwatchman at least ${count} time${pluralize(count)}.`
        : `No player has been visited by a Nightwatchman yet.`,
  },
  {
    id: "noble_know_demon",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["noble"],
    source: "grimoire_event",
    label: "Court of the Damned",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Know"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);
            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Noble, you've seen the Demon among your learned players ${count} time${pluralize(count)}.`
          : `As the Noble, this player has seen the Demon among their learned players ${count} time${pluralize(count)}.`)
        : `As the Noble, have the Demon among the 3 players you learn.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Noble has seen the Demon among their learned players at least ${count} time${pluralize(count)}.`
        : `No Noble has seen the Demon among their learned players yet.`,
  },
  // Oracle [sao: 7]: Nothing relevant. Only option: Highest number learned in one game?
  {
    id: "pacifist_saves",
    category: "role",
    scope: "as_role",
    roleIds: ["pacifist"],
    script: "bmr",
    sao: 12,
    source: "grimoire_event",
    label: "Peacekeeper",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Saved"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pacifist, you've saved ${count} player${pluralize(count)} from execution.`
          : `As the Pacifist, this player has saved ${count} player${pluralize(count)} from execution.`)
        : `As the Pacifist, save a player from execution.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} saved from execution by a Pacifist.`
        : `No Pacifist has saved a player from execution yet.`,
  },
  {
    id: "philosopher_drunk",
    category: "role",
    scope: "as_role",
    roleIds: ["philosopher"],
    script: "snv",
    sao: 10,
    source: "grimoire_event",
    label: "Price of Insight",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Philosopher, you've selected an in-play character and made them drunk ${count} time${pluralize(count)}.`
          : `As the Philosopher, this player has selected an in-play character and made them drunk ${count} time${pluralize(count)}.`)
        : `As the Philosopher, select an in-play character and make them drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An in-play character has been made drunk by a Philosopher at least ${count} time${pluralize(count)}.`
        : `No Philosopher has made an in-play character drunk yet.`,
  },
  {
    id: "philosopher_drunk_received",
    category: "role",
    roleIds: ["philosopher"],
    scope: "affected_player",
    script: "snv",
    sao: 10,
    source: "grimoire_event",
    label: "Borrowed Identity",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "philosopher"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been made drunk by the Philosopher ${count} time${pluralize(count)} when they selected your character.`
          : `This player has been made drunk by the Philosopher ${count} time${pluralize(count)} when they selected their character.`)
        : `Become drunk due to the Philosopher selecting your character.`,
  },
  {
    id: "pixie_has_ability_uses",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["pixie"],
    source: "grimoire_event",
    label: "Fae Legacy",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Has Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pixie, you've gained another character's ability ${count} time${pluralize(count)}.`
          : `As the Pixie, this player has gained another character's ability ${count} time${pluralize(count)}.`)
        : `As the Pixie, gain another character's ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Pixie has gained another character's ability at least ${count} time${pluralize(count)}.`
        : `No Pixie has gained another character's ability yet.`,
  },
  {
    id: "pixie_madness_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["pixie"],
    source: "grimoire_event",
    label: "Stolen Spotlight",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "pixie" &&
          event.event_type === GrimoireEventType.MAD &&
          event.status_source === "Mad"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've had a Pixie be mad as your character ${count} time${pluralize(count)}.`
          : `This player has had a Pixie be mad as their character ${count} time${pluralize(count)}.`)
        : `Have a Pixie be mad as your character.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Pixie has been mad as another character at least ${count} time${pluralize(count)}.`
        : `No Pixie has been mad as another character yet.`,
  },
  {
    id: "poppy_grower_deaths_before_wake",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["poppy_grower"],
    source: "grimoire_event",
    label: "Delayed Awakening",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let maxDeathsBeforeWake = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const wakeEvents = game.grimoire_events.filter(
          (event) =>
            event.by_role_id === roleId &&
            event.event_type === GrimoireEventType.OTHER &&
            event.status_source === "Evil Wakes"
        );
        if (!wakeEvents.length) continue;

        const wakePage = Math.min(...wakeEvents.map((event) => event.grimoire_page));
        const deathsBeforeWake = game.grimoire_events.filter(
          (event) =>
            (event.event_type === GrimoireEventType.DEATH ||
              event.event_type === GrimoireEventType.EXECUTION ||
              event.event_type === GrimoireEventType.NOT_RECORDED) &&
            event.grimoire_page < wakePage
        ).length;

        if (deathsBeforeWake > maxDeathsBeforeWake) {
          maxDeathsBeforeWake = deathsBeforeWake;
        }
      }

      return maxDeathsBeforeWake;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Poppy Grower, the highest number of players in a single game who died before you did is ${count}.`
          : `As the Poppy Grower, the highest number of players in a single game who died before this player did is ${count}.`)
        : `As the Poppy Grower, die after deaths so evil wakes.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The highest number of players who died before a Poppy Grower died is ${count}.`
        : `No Poppy Grower has died after other players yet.`,
  },
  {
    id: "preacher_chosen",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["preacher"],
    source: "grimoire_event",
    label: "Preach!",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "No Ability"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "MINION" ||
              previousToken?.role?.type === "MINION"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Preacher, you've chosen ${count} minion${pluralize(count)}.`
          : `As the Preacher, this player has chosen ${count} minion${pluralize(count)}.`)
        : `As the Preacher, choose a minion.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} minion${pluralize(count)} ${wasWere(count)} chosen by a Preacher.`
        : `No Preacher has chosen a minion yet.`,
  },
  {
    id: "preacher_chosen_highest",
    category: "role",
    scope: "as_role",
    script: "experimental",
    roleIds: ["preacher"],
    source: "grimoire_event",
    label: "Preaching to the Masses",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let maxChosenInSingleGame = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const chosenInGame = game.grimoire_events.filter((event) => {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.OTHER ||
            event.status_source !== "No Ability"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);

          return (
            currentToken?.role?.type === "MINION" ||
            previousToken?.role?.type === "MINION"
          );
        }).length;

        if (chosenInGame > maxChosenInSingleGame) {
          maxChosenInSingleGame = chosenInGame;
        }
      }

      return maxChosenInSingleGame;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Preacher, your highest number of minions chosen in a single game is ${count}.`
          : `As the Preacher, this player's highest number of minions chosen in a single game is ${count}.`)
        : `As the Preacher, choose multiple minions in a single game.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The highest number of minions chosen by a Preacher in a single game is ${count}.`
        : `No Preacher has chosen multiple minions in a single game yet.`,
  },
  {
    id: "preacher_chosen_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["preacher"],
    source: "grimoire_event",
    label: "Singled Out in Sermon",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (
          event.by_role_id !== "preacher" ||
          event.event_type !== GrimoireEventType.OTHER ||
          event.status_source !== "No Ability"
        ) {
          return false;
        }

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);

        return (
          currentToken?.role?.type === "MINION" ||
          previousToken?.role?.type === "MINION"
        );
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been chosen by the Preacher ${count} time${pluralize(count)} as a minion.`
          : `This player has been chosen by the Preacher ${count} time${pluralize(count)} as a minion.`)
        : `Be chosen by the Preacher as a minion.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A minion has been chosen by a Preacher at least ${count} time${pluralize(count)}.`
        : `No minion has been chosen by a Preacher yet.`,
  },
  {
    id: "princess_kills_prevented",
    category: "role",
    scope: "as_role",
    roleIds: ["princess"],
    script: "experimental",
    source: "grimoire_event",
    label: "Peace by Command",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Doesn't Kill"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Princess, you've prevented a Demon from killing ${count} time${pluralize(count)}.`
          : `As the Princess, this player has prevented a Demon from killing ${count} time${pluralize(count)}.`)
        : `As the Princess, prevent a Demon from killing.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Princess has prevented a Demon from killing at least ${count} time${pluralize(count)}.`
        : `No Princess has prevented a Demon from killing yet.`,
  },
  {
    id: "princess_kills_prevented_received",
    category: "role",
    roleIds: ["princess"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Silenced by Decree",
    getCount: ({ games }) =>
      countMatchingEvents(games, (_, event) => {
        if (
          event.by_role_id !== "princess" ||
          event.event_type !== GrimoireEventType.OTHER ||
          event.status_source !== "Doesn't Kill"
        ) {
          return false;
        }

        return true;
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been prevented from killing ${count} time${pluralize(count)} due to the Princess's ability.`
          : `This player has been prevented from killing ${count} time${pluralize(count)} due to the Princess's ability.`)
        : `Be prevented from killing due to the Princess's ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Demon has been prevented from killing by a Princess at least ${count} time${pluralize(count)}.`
        : `No Demon has been prevented from killing by a Princess yet.`,
  },
  {
    id: "professor_revives",
    category: "role",
    scope: "as_role",
    roleIds: ["professor"],
    script: "bmr",
    sao: 9,
    source: "grimoire_event",
    label: "It's Alive!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Professor, you've brought ${count} Townsfolk back to life.`
          : `As the Professor, this player has brought ${count} Townsfolk back to life.`)
        : `As the Professor, bring a Townsfolk back to life.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Townsfolk ${wasWere(count)} brought back to life by a Professor.`
        : `No Professor has brought a Townsfolk back to life yet.`,
  },
  {
    id: "ravenkeeper_demon_choices",
    category: "role",
    scope: "as_role",
    roleIds: ["ravenkeeper"],
    script: "tb",
    sao: 9,
    source: "grimoire_event",
    label: "Dying Insight",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Chosen"
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Ravenkeeper, you've chosen the Demon ${count} time${pluralize(count)} after dying.`
          : `As the Ravenkeeper, this player has chosen the Demon ${count} time${pluralize(count)} after dying.`)
        : `As the Ravenkeeper, choose the Demon after dying.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Ravenkeeper has chosen the Demon after dying at least ${count} time${pluralize(count)}.`
        : `No Ravenkeeper has chosen the Demon after dying yet.`,
  },
  {
    id: "sage_demon_kills_received",
    category: "role",
    roleIds: ["sage"],
    scope: "affected_player",
    script: "snv",
    sao: 13,
    source: "grimoire_event",
    label: "Candle Extinguished",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (!isDemonKillEvent(game, event)) return false;

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);

        return currentToken?.role_id === "sage" || previousToken?.role_id === "sage";
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Sage, you've been killed by the Demon ${count} time${pluralize(count)}.`
          : `As the Sage, this player has been killed by the Demon ${count} time${pluralize(count)}.`)
        : `As the Sage, be killed by the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Sage has been killed by the Demon at least ${count} time${pluralize(count)}.`
        : `No Sage has been killed by the Demon yet.`,
  },
  {
    id: "sailor_drunk",
    category: "role",
    scope: "as_role",
    roleIds: ["sailor"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Passed the Bottle",
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
              event.participant_id !== event.by_participant_id
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Sailor, you've made ${count} player${pluralize(count)} drunk.`
          : `As the Sailor, this player has made ${count} player${pluralize(count)} drunk.`)
        : `As the Sailor, make another player drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} made drunk by a Sailor.`
        : `No Sailor has made another player drunk yet.`,
  },
  {
    id: "sailor_self_drunk",
    category: "role",
    scope: "as_role",
    roleIds: ["sailor"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Drank Too Deep",
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
          ? `As the Sailor, you've made yourself drunk ${count} time${pluralize(count)}.`
          : `As the Sailor, this player has made themselves drunk ${count} time${pluralize(count)}.`)
        : `As the Sailor, make yourself drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Sailor has made themselves drunk at least ${count} time${pluralize(count)}.`
        : `No Sailor has made themselves drunk yet.`,
  },
  {
    id: "sailor_saved_self",
    category: "role",
    scope: "as_role",
    roleIds: ["sailor"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Unsinkable",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.event_type === GrimoireEventType.OTHER &&
              (event.status_source ?? "").trim().toLowerCase() === "saved" &&
              event.by_role_id === roleId &&
              ((!!event.by_participant_id &&
                event.participant_id === event.by_participant_id) ||
                event.role_id === roleId)
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Sailor, you've avoided ${count} death${pluralize(count)}.`
          : `As the Sailor, this player has avoided ${count} death${pluralize(count)}.`)
        : `As the Sailor, survive death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Sailor has avoided death at least ${count} time${pluralize(count)}.`
        : `No Sailor has avoided death yet.`,
  },
  // Savant [sao: 8]: Nothing relevant. Only option: Can't think of anything..
  {
    id: "seamstress_ability_uses",
    category: "role",
    scope: "as_role",
    roleIds: ["seamstress"],
    script: "snv",
    sao: 9,
    source: "grimoire_event",
    label: "Threaded Clue",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Seamstress, you've used your ability ${count} time${pluralize(count)}.`
          : `As the Seamstress, this player has used their ability ${count} time${pluralize(count)}.`)
        : `As the Seamstress, use your ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Seamstress has used their ability at least ${count} time${pluralize(count)}.`
        : `No Seamstress has used their ability yet.`,
  },
  // Shugenja: Nothing relevant. Only option: If they had more clockwise or counterclockwise?
  {
    id: "slayer_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["slayer"],
    script: "tb",
    sao: 11,
    source: "grimoire_event",
    label: "Bullseye",
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
              currentToken?.role?.type === "DEMON" ||
              previousToken?.role?.type === "DEMON"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Slayer, you've killed ${count} Demon${pluralize(count)}.`
          : `As the Slayer, this player has killed ${count} Demon${pluralize(count)}.`)
        : `As the Slayer, kill the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Demon${pluralize(count)} ${wasWere(count)} killed by a Slayer.`
        : `No Slayer has killed a Demon yet.`,
  },
  {
    id: "slayer_game_ending_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["slayer"],
    script: "tb",
    source: "end_trigger",
    sao: 11,
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
      count > 0
        ? (isMe
          ? `As the Slayer, you've ended ${count} game${pluralize(count)} by killing the demon.`
          : `As the Slayer, this player has ended ${count} game${pluralize(count)} by killing the demon.`)
        : `As the Slayer, end a game by killing the demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Slayer killing the Demon.`
        : `No Slayer has ended a game by killing the Demon yet.`,
  },
  {
    id: "slayer_recluse_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["slayer"],
    script: "tb",
    sao: 11,
    hidden: true,
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
      count > 0
        ? (isMe
          ? `As the Slayer, you've killed the Recluse ${count} time${pluralize(count)}.`
          : `As the Slayer, this player has killed the Recluse ${count} time${pluralize(count)}.`)
        : `As the Slayer, kill the Recluse.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has been killed by a Slayer at least ${count} time${pluralize(count)}.`
        : `No Slayer has killed the Recluse yet.`,
  },
  {
    id: "snake_charmer_demon_charms",
    category: "role",
    scope: "as_role",
    roleIds: ["snake_charmer"],
    script: "snv",
    sao: 3,
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
      count > 0
        ? (isMe
          ? `As the Snake Charmer, you've charmed ${count} Demon${pluralize(count)}.`
          : `As the Snake Charmer, this player has charmed ${count} Demon${pluralize(count)}.`)
        : `As the Snake Charmer, successfully charm the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Demon${pluralize(count)} ${wasWere(count)} charmed by a Snake Charmer.`
        : `No Snake Charmer has charmed the Demon yet.`,
  },
  // {
  //   id: "snake_charmer_post_charm_win_rate",
  //   category: "role",
  //   scope: "as_role",
  //   roleIds: ["snake_charmer"],
  //   script: "snv",
  //   sao: 3,
  //   source: "grimoire_event",
  //   label: "Calculated Risk",
  //   getCount: ({ games, roleId }) => {
  //     if (!roleId) return 0;

  //     const charmedGames = games.filter((game) => {
  //       if (game.ignore_for_stats) return false;

  //       return game.grimoire_events.some((event) => {
  //         if (
  //           event.by_role_id !== roleId ||
  //           event.event_type !== GrimoireEventType.ROLE_CHANGE
  //         ) {
  //           return false;
  //         }

  //         const previousToken = getEventPreviousToken(game, event);
  //         const currentToken = getEventCurrentToken(game, event);

  //         return (
  //           previousToken?.role?.type === "DEMON" &&
  //           currentToken?.role_id === roleId
  //         );
  //       });
  //     });

  //     if (!charmedGames.length) return 0;

  //     // After a successful charm, the Snake Charmer usually becomes the demon and
  //     // therefore wants EVIL_WINS. This intentionally ignores rare edge cases like
  //     // a good demon being charmed, because the normal evil-demon case is by far
  //     // the most common interpretation of this stat.
  //     const wins = charmedGames.filter((game) => game.win_v2 === "EVIL_WINS").length;
  //     return Math.round((wins / charmedGames.length) * 100);
  //   },
  //   getSentence: ({ games, count, isMe, roleId }) => {
  //     const hasCharmedDemon =
  //       !!roleId &&
  //       games.some((game) => {
  //         if (game.ignore_for_stats) return false;

  //         return game.grimoire_events.some((event) => {
  //           if (
  //             event.by_role_id !== roleId ||
  //             event.event_type !== GrimoireEventType.ROLE_CHANGE
  //           ) {
  //             return false;
  //           }

  //           const previousToken = getEventPreviousToken(game, event);
  //           const currentToken = getEventCurrentToken(game, event);

  //           return (
  //             previousToken?.role?.type === "DEMON" &&
  //             currentToken?.role_id === roleId
  //           );
  //         });
  //       });

  //     if (!hasCharmedDemon) {
  //       return `As the Snake Charmer, win a game after charming the Demon.`;
  //     }

  //     return isMe
  //       ? `As the Snake Charmer, you've won ${count}% of games where you charmed the Demon.`
  //       : `As the Snake Charmer, this player has won ${count}% of games where they charmed the Demon.`;
  //   },
  // },
  {
    id: "snake_charmer_demon_charms_received",
    category: "role",
    roleIds: ["snake_charmer"],
    scope: "affected_player",
    script: "snv",
    sao: 3,
    source: "grimoire_event",
    label: "Snakebit",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "snake_charmer"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been charmed by the Snake Charmer ${count} time${pluralize(count)}.`
          : `This player has been charmed by the Snake Charmer ${count} time${pluralize(count)}.`)
        : `As a Demon, be charmed by the Snake Charmer.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Demon has been charmed by a Snake Charmer at least ${count} time${pluralize(count)}.`
        : `No Demon has been charmed by a Snake Charmer yet.`,
  },
  {
    id: "soldier_saved_from_demon_kill",
    category: "role",
    scope: "as_role",
    roleIds: ["soldier"],
    script: "tb",
    sao: 12,
    source: "grimoire_event",
    label: "Battle-Hardened",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Saved"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Soldier, you've survived ${count} Demon attack${pluralize(count)}.`
          : `As the Soldier, this player has survived ${count} Demon attack${pluralize(count)}.`)
        : `As the Soldier, survive a Demon attack.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Soldier has survived a Demon attack at least ${count} time${pluralize(count)}.`
        : `No Soldier has survived a Demon attack yet.`,
  },
  {
    id: "steward_spy",
    category: "role",
    scope: "as_role",
    roleIds: ["steward"],
    script: "experimental",
    source: "grimoire_event",
    label: "Misplaced Trust",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Know"
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
          ? `As the Steward, you've seen the Spy as a good player ${count} time${pluralize(count)}.`
          : `As the Steward, this player has seen the Spy as a good player ${count} time${pluralize(count)}.`)
        : `As the Steward, see the Spy as a good player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as Good by a Steward at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as Good by a Steward yet.`,
  },
  {
    id: "tea_lady_saved_players",
    category: "role",
    scope: "as_role",
    roleIds: ["tea_lady"],
    script: "bmr",
    sao: 11,
    source: "grimoire_event",
    label: "Safe in Company",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Saved"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Tea Lady, you've saved ${count} player${pluralize(count)} from death.`
          : `As the Tea Lady, this player has saved ${count} player${pluralize(count)} from death.`)
        : `As the Tea Lady, save a player from death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} saved from death by a Tea Lady.`
        : `No Tea Lady has saved a player from death yet.`,
  },
  // Town Crier [sao: 6]: Nothing relevant. Only option: If they got a yes?
  {
    id: "undertaker_burials",
    category: "role",
    scope: "as_role",
    roleIds: ["undertaker"],
    script: "tb",
    sao: 7,
    source: "grimoire_event",
    label: "Graveyard Shift",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Died Today"
            ) {
              return false;
            }

            const undertakerOnPage =
              game.grimoire[event.grimoire_page]?.tokens.find(
                (token) =>
                  !!event.by_participant_id &&
                  token.grimoire_participant_id === event.by_participant_id
              ) ??
              game.grimoire[event.grimoire_page]?.tokens.find(
                (token) => token.role_id === roleId
              );

            return (
              undertakerOnPage?.role_id === roleId &&
              undertakerOnPage.is_dead === false
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Undertaker, you've learned the character of ${count} executed player${pluralize(count)}.`
          : `As the Undertaker, this player has learned the character of ${count} executed player${pluralize(count)}.`)
        : `As the Undertaker, learn the character of an executed player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Undertaker has learned the character of at least ${count} executed player${pluralize(count)}.`
        : `No Undertaker has learned the character of an executed player yet.`,
  },
  {
    id: "village_idiot_drunk_received",
    category: "role",
    roleIds: ["village_idiot"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Biggest Idiot",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          (event.by_role_id === "village_idiot" ||
            (!event.by_role_id && event.role_id === "village_idiot"))
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been the drunk Village Idiot ${count} time${pluralize(count)}.`
          : `This player has been the drunk Village Idiot ${count} time${pluralize(count)}.`)
        : `Be the drunk Village Idiot.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Village Idiot has been drunk at least ${count} time${pluralize(count)}.`
        : `No Village Idiot has been drunk yet.`,
  },
  {
    id: "virgin_executions",
    category: "role",
    scope: "as_role",
    roleIds: ["virgin"],
    script: "tb",
    sao: 10,
    source: "grimoire_event",
    label: "Unblemished",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Virgin, you've caused ${count} immediate execution${pluralize(count)} by being nominated.`
          : `As the Virgin, this player has caused ${count} immediate execution${pluralize(count)} by being nominated.`)
        : `As the Virgin, cause an immediate execution by being nominated.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} immediate execution${pluralize(count)} ${wasWere(count)} caused by a Virgin being nominated.`
        : `No Virgin has caused an immediate execution by being nominated yet.`,
  },
  {
    id: "washerwoman_top_role",
    category: "role",
    visibility: "global",
    scope: "as_role",
    roleIds: ["washerwoman"],
    source: "grimoire_event",
    label: "Laundry Day",
    getCount: ({ games, roleId }) => getWasherwomanMostShownRole(games, roleId).count,
    getSentence: () => "This stat is only shown in global role stats.",
    getGlobalSentence: ({ games, roleId }) => {
      const top = getWasherwomanMostShownRole(games, roleId);
      if (!top.role || top.count === 0) {
        return "No character has been shown to a Washerwoman yet.";
      }
      return `The ${top.role.name} has been shown to the Washerwoman at least ${top.count} time${pluralize(top.count)}, making it the most shown character.`;
    },
  },
  {
    id: "washerwoman_spy",
    category: "role",
    scope: "as_role",
    roleIds: ["washerwoman"],
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "Dirty Laundry",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Townsfolk"
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
          ? `As the Washerwoman, you've seen the Spy as Townsfolk ${count} time${pluralize(count)}.`
          : `As the Washerwoman, this player has seen the Spy as Townsfolk ${count} time${pluralize(count)}.`)
        : `As the Washerwoman, see the Spy as Townsfolk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as Townsfolk by a Washerwoman at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as Townsfolk by a Washerwoman yet.`,
  },
];
