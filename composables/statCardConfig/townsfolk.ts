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

export const TOWNSFOLK_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "acrobat_self_deaths",
    category: "role",
    script: "experimental",
    roleIds: ["acrobat"],
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
  },
  // Alchemist: Too complex
  {
    id: "alsaahir_game_endings",
    category: "role",
    script: "experimental",
    roleIds: ["alsaahir"],
    source: "end_trigger",
    label: "Last Draw",
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
          ? `As the Alsaahir, you've ended the game ${count} time${pluralize(count)} by guessing correctly.`
          : `As the Alsaahir, this player has ended the game ${count} time${pluralize(count)} by guessing correctly.`)
        : `As the Alsaahir, end the game by guessing correctly.`,
  },
  {
    id: "artist_ability_uses",
    category: "role",
    script: "experimental",
    roleIds: ["artist"],
    source: "grimoire_event",
    label: "Single Stroke",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Artist, you've asked the Storyteller a question ${count} time${pluralize(count)}.`
          : `As the Artist, this player has asked the Storyteller a question ${count} time${pluralize(count)}.`)
        : `As the Artist, ask the Storyteller a question.`,
  },
  // Atheist: @todo (game end)
  // Balloonist: Nothing to track really.
  // Banshee: @todo ?
  {
    id: "bounty_hunter_townsfolk_turned_evil",
    category: "role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Bounty Hunter, you've turned ${count} Townsfolk evil.`
          : `As the Bounty Hunter, this player has turned ${count} Townsfolk evil.`)
        : `As the Bounty Hunter, turn a Townsfolk evil.`,
  },
  {
    id: "bounty_hunter_evil_executions",
    category: "role",
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
  },
  {
    id: "bounty_hunter_alignment_changes_received",
    category: "role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `You've turned evil ${count} time${pluralize(count)} due to the Bounty Hunter.`
          : `This player has turned evil ${count} time${pluralize(count)} due to the Bounty Hunter.`)
        : `Turn evil due to the Bounty Hunter.`,
  },
  {
    id: "cannibal_good_lunches",
    category: "role",
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
  },
  {
    id: "cannibal_evil_lunches",
    category: "role",
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
  },
  // Chambermaid: No reminder token(s) and nothing to track really.
  // Chef: No reminder token(s), would have been cool to track highest number somehow.
  // Choirboy: No reminder token(s), would have been cool to track how many times their ability worked somehow.
  // Clockmaker: No reminder token(s) and nothing to track really.
  {
    id: "courtier_drunk",
    category: "role",
    script: "bmr",
    roleIds: ["courtier"],
    source: "grimoire_event",
    label: "Menu Selection",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Courtier, you've successfully chosen an in-play character and made them drunk ${count} time${pluralize(count)}.`
          : `As the Courtier, this player has successfully chosen an in-play character and made them drunk ${count} time${pluralize(count)}.`)
        : `As the Courtier, successfully choose an in-play character and make them drunk.`,
  },
  {
    id: "courtier_drunk_received",
    category: "role",
    script: "bmr",
    roleIds: ["courtier"],
    source: "grimoire_event",
    label: "Three-Day Hangover",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
        : `As the Cult Leader, change alignment due to your ability.`,
  },
  {
    id: "cult_leader_evil_cults",
    category: "role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Cult Leader, you've ended ${count} game${pluralize(count)} by forming an evil cult.`
          : `As the Cult Leader, this player has ended ${count} game${pluralize(count)} by forming an evil cult.`)
        : `As the Cult Leader, end the game by forming an evil cult.`,
  },
  {
    id: "cult_leader_good_cults",
    category: "role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Cult Leader, you've ended ${count} game${pluralize(count)} by forming a good cult.`
          : `As the Cult Leader, this player has ended ${count} game${pluralize(count)} by forming a good cult.`)
        : `As the Cult Leader, end the game by forming a good cult.`,
  },
  // Dreamer: No reminder token(s) to track, would have been cool to track how many times they picked the demon.
  // Empath: No reminder tokens to track. Load grim and check first page for sitting next to two evils?
  {
    id: "engineer_uses",
    category: "role",
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
          ? `As the Engineer, you've reassembled ${count} evil team${pluralize(count)} with your ability.`
          : `As the Engineer, this player has reassembled ${count} evil team${pluralize(count)} with their ability.`)
        : `As the Engineer, assemble a new evil team.`,
  },
  {
    id: "exorcist_demon_picks",
    category: "role",
    script: "bmr",
    roleIds: ["exorcist"],
    source: "grimoire_event",
    label: "The Power of Christ Compels You",
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
  },
  {
    id: "farmer_role_changes",
    category: "role",
    script: "experimental",
    roleIds: ["farmer"],
    source: "grimoire_event",
    label: "Passing The Plough",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Farmer, you've died and created another Farmer ${count} time${pluralize(count)}.`
          : `As the Farmer, this player has died and created another Farmer ${count} time${pluralize(count)}.`)
        : `As the Farmer, die and create another Farmer.`,
  },
  {
    id: "fisherman_advice_used",
    category: "role",
    script: "experimental",
    roleIds: ["fisherman"],
    source: "grimoire_event",
    label: "Gone Fishing",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fisherman, you've asked the storyteller for advice ${count} time${pluralize(count)}.`
          : `As the Fisherman, this player has asked the storyteller for advice ${count} time${pluralize(count)}.`)
        : `As the Fisherman, ask the storyteller for advice.`,
  },
  // Flowergirl: Nothing to track really.
  {
    id: "fool_saved_from_death",
    category: "role",
    script: "bmr",
    roleIds: ["fool"],
    source: "grimoire_event",
    label: "Not Today",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fool, you've survived death due to your ability ${count} time${pluralize(count)}.`
          : `As the Fool, this player has survived death due to their ability ${count} time${pluralize(count)}.`)
        : `As the Fool, survive death due to your ability.`,
  },
  {
    id: "fortune_teller_red_herring_received",
    category: "role",
    script: "tb",
    roleIds: ["fortune_teller"],
    source: "grimoire_event",
    label: "False Trail",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
  },
  {
    id: "fortune_teller_demon",
    category: "role",
    script: "tb",
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
          ? `As the Fortune Teller, you've got a "Yes" on the Demon ${count} time${pluralize(count)}.`
          : `As the Fortune Teller, this player has got a "Yes" on the Demon ${count} time${pluralize(count)}.`)
        : `As the Fortune Teller, get a "Yes" on the Demon.`,
  },
  {
    id: "fortune_teller_recluse",
    category: "role",
    script: "tb",
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
          ? `As the Fortune Teller, you've got a "Yes" on the Recluse ${count} time${pluralize(count)}.`
          : `As the Fortune Teller, this player has got a "Yes" on the Recluse ${count} time${pluralize(count)}.`)
        : `As the Fortune Teller, get a "Yes" on the Recluse.`,
  },
  {
    id: "fortune_teller_recluse_received",
    category: "role",
    script: "tb",
    roleIds: ["fortune_teller"],
    source: "grimoire_event",
    label: "Unlucky Reading",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.OTHER ||
            event.by_role_id !== "fortune_teller" ||
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
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Recluse, you've been seen as a Demon by the Fortune Teller ${count} time${pluralize(count)}.`
          : `As the Recluse, this player has been seen as a Demon by the Fortune Teller ${count} time${pluralize(count)}.`)
        : `As the Recluse, be seen as a Demon by the Fortune Teller.`,
  },
  {
    id: "gambler_self_deaths",
    category: "role",
    script: "bmr",
    roleIds: ["gambler"],
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
  },
  // General: No reminder token(s) and nothing to track really.
  {
    id: "gossip_kills",
    category: "role",
    script: "bmr",
    roleIds: ["gossip"],
    source: "grimoire_event",
    label: "Loose Lips",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gossip, you've made ${count} statement${pluralize(count)} that proved deadly.`
          : `As the Gossip, this player has made ${count} statement${pluralize(count)} that proved deadly.`)
        : `As the Gossip, make a statement that kills a player.`,
  },
  {
    id: "grandmother_ability_deaths",
    category: "role",
    script: "bmr",
    roleIds: ["grandmother"],
    source: "grimoire_event",
    label: "Shared Fate",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Grandmother, you've died ${count} time${pluralize(count)} when your grandchild was killed by the Demon.`
          : `As the Grandmother, this player has died ${count} time${pluralize(count)} when their grandchild was killed by the Demon.`)
        : `As the Grandmother, die when your grandchild is killed by the Demon.`,
  },
  // High Priestess: No reminder token(s), would have been cool to track how many times they were sent to evil? Or how many times the priestess was sent to you.
  {
    id: "huntsman_damsel_saves",
    category: "role",
    script: "experimental",
    roleIds: ["huntsman"],
    source: "grimoire_event",
    label: "Just In Time",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Huntsman, you've saved the Damsel ${count} time${pluralize(count)}.`
          : `As the Huntsman, this player has saved the Damsel ${count} time${pluralize(count)}.`)
        : `As the Huntsman, save the Damsel.`,
  },
  {
    id: "huntsman_ability_uses",
    category: "role",
    script: "experimental",
    roleIds: ["huntsman"],
    source: "grimoire_event",
    label: "Rescue Attempt",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "No Ability"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Huntsman, you've used your ability to choose a player ${count} time${pluralize(count)}.`
          : `As the Huntsman, this player has used their ability to choose a player ${count} time${pluralize(count)}.`)
        : `As the Huntsman, use your ability to choose a player.`,
  },
  {
    id: "huntsman_wrong_choices",
    category: "role",
    script: "experimental",
    roleIds: ["huntsman"],
    source: "grimoire_event",
    label: "Off the Trail",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        const abilityUses = game.grimoire_events.filter(
          (event) =>
            event.by_role_id === roleId &&
            event.event_type === GrimoireEventType.OTHER &&
            event.status_source === "No Ability"
        );

        const wrongChoices = abilityUses.filter((abilityUse) => {
          const successfulChoiceInSamePage = game.grimoire_events.some(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.ROLE_CHANGE &&
              event.grimoire_page === abilityUse.grimoire_page
          );

          return !successfulChoiceInSamePage;
        }).length;

        return total + wrongChoices;
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Huntsman, you've chosen the wrong player ${count} time${pluralize(count)}.`
          : `As the Huntsman, this player has chosen the wrong player ${count} time${pluralize(count)}.`)
        : `As the Huntsman, choose the wrong player.`,
  },
  {
    id: "innkeeper_drunk_caused",
    category: "role",
    script: "bmr",
    roleIds: ["innkeeper"],
    source: "grimoire_event",
    label: "House Special",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Innkeeper, you've made ${count} player${pluralize(count)} drunk.`
          : `As the Innkeeper, this player has made ${count} player${pluralize(count)} drunk.`)
        : `As the Innkeeper, make a player drunk due to your ability.`,
  },
  {
    id: "innkeeper_drunk_received",
    category: "role",
    script: "bmr",
    roleIds: ["innkeeper"],
    source: "grimoire_event",
    label: "Innkeeper's Pour",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
  // Investigator: Nothing to track really.
  {
    id: "juggler_correct",
    category: "role",
    script: "snv",
    roleIds: ["juggler"],
    source: "grimoire_event",
    label: "On the Mark",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source?.toLowerCase() === "correct"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Juggler, you've had ${count} correct juggle${pluralize(count)}.`
          : `As the Juggler, this player has had ${count} correct juggle${pluralize(count)}.`)
        : `As the Juggler, have a correct juggle.`,
  },
  {
    id: "juggler_highest_correct_single_game",
    category: "role",
    script: "snv",
    roleIds: ["juggler"],
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

      return maxCorrectInSingleGame;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Juggler, your highest number of correct juggles in a single game is ${count}.`
          : `As the Juggler, this player's highest number of correct juggles in a single game is ${count}.`)
        : `As the Juggler, have a correct juggle in a single game.`,
  },
  // King: Nothing to track really.
  // Knight: Nothing to track really.
  {
    id: "librarian_spy",
    category: "role",
    script: "tb",
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
          ? `As the Librarian, you've been shown the Spy as an Outsider ${count} time${pluralize(count)}.`
          : `As the Librarian, this player has been shown the Spy as an Outsider ${count} time${pluralize(count)}.`)
        : `As the Librarian, see the Spy as an Outsider.`,
  },
  {
    id: "librarian_spy_received",
    category: "role",
    script: "tb",
    roleIds: ["librarian"],
    source: "grimoire_event",
    label: "Membership Forged",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(games, username, (game, event) => {
        if (
          event.by_role_id !== "librarian" ||
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
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Spy, you've been seen as an Outsider by the Librarian ${count} time${pluralize(count)}.`
          : `As the Spy, this player has been seen as an Outsider by the Librarian ${count} time${pluralize(count)}.`)
        : `As the Spy, be seen as an Outsider by the Librarian.`,
  },
  {
    id: "lycanthrope_good_kills",
    category: "role",
    script: "experimental",
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
      count > 0
        ? (isMe
          ? `As the Lycanthrope, you've mauled ${count} good player${pluralize(count)}.`
          : `As the Lycanthrope, this player has mauled ${count} good player${pluralize(count)}.`)
        : `As the Lycanthrope, kill a good player.`,
  },
  {
    id: "lycanthrope_spy_kills",
    category: "role",
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
  },
  // Magician: No reminder token(s) and nothing to track really.
  // Mathematician: @todo
  {
    id: "mayor_game_endings",
    category: "role",
    script: "tb",
    roleIds: ["mayor"],
    source: "end_trigger",
    label: "Mayoral Mandate",
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
          ? `As the Mayor, you've won ${count} game${pluralize(count)} with your ability.`
          : `As the Mayor, this player has won ${count} game${pluralize(count)} with their ability.`)
        : `As the Mayor, win a game due to your ability.`,
  },
  {
    id: "mayor_bounces",
    category: "role",
    script: "tb",
    roleIds: ["mayor"],
    source: "grimoire_event",
    label: "Mandate Extension",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Bounce"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mayor, you've caused ${count} death${pluralize(count)} to bounce to someone else.`
          : `As the Mayor, this player has caused ${count} death${pluralize(count)} to bounce to someone else.`)
        : `As the Mayor, have your death bounced to someone else.`,
  },
  // Minstrel: @todo
  {
    id: "monk_saves",
    category: "role",
    script: "tb",
    roleIds: ["monk"],
    source: "grimoire_event",
    label: "Divine Protection",
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
          ? `As the Monk, you've protected a player from the Demon ${count} time${pluralize(count)}.`
          : `As the Monk, this player has protected a player from the Demon ${count} time${pluralize(count)}.`)
        : `As the Monk, protect a player from the Demon.`,
  },
  {
    id: "nightwatchman_ability_uses",
    category: "role",
    script: "experimental",
    roleIds: ["nightwatchman"],
    source: "grimoire_event",
    label: "Nightly Patrol",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Chosen"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Nightwatchman, you've chosen a player with your ability ${count} time${pluralize(count)}.`
          : `As the Nightwatchman, this player has chosen a player with their ability ${count} time${pluralize(count)}.`)
        : `As the Nightwatchman, choose a player with your ability.`,
  },
  {
    id: "nightwatchman_ability_received",
    category: "role",
    script: "experimental",
    roleIds: ["nightwatchman"],
    source: "grimoire_event",
    label: "Midnight Visit",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
  },
  // Noble: Nothing to track really. (Unless we track how many times demon was in 3?)
  // Oracle: No reminder token(s) and nothing to track really.
  {
    id: "pacifist_saves",
    category: "role",
    script: "bmr",
    roleIds: ["pacifist"],
    source: "grimoire_event",
    label: "Peacekeeper",
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
          ? `As the Pacifist, you've saved a player from execution ${count} time${pluralize(count)}.`
          : `As the Pacifist, this player has saved a player from execution ${count} time${pluralize(count)}.`)
        : `As the Pacifist, save a player from execution.`,
  },
  {
    id: "philosopher_drunk",
    category: "role",
    script: "snv",
    roleIds: ["philosopher"],
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
  },
  {
    id: "philosopher_drunk_received",
    category: "role",
    script: "snv",
    roleIds: ["philosopher"],
    source: "grimoire_event",
    label: "Borrowed Identity",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "philosopher"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've become drunk ${count} time${pluralize(count)} when the Philosopher selected your character.`
          : `This player has become drunk ${count} time${pluralize(count)} when the Philosopher selected their character.`)
        : `Become drunk due to the Philosopher selecting your character.`,
  },
  {
    id: "pixie_role_changes",
    category: "role",
    script: "experimental",
    roleIds: ["pixie"],
    source: "grimoire_event",
    label: "Fae Inheritance",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pixie, you've transformed into another character you were mad as ${count} time${pluralize(count)}.`
          : `As the Pixie, this player has transformed into another character they were mad as ${count} time${pluralize(count)}.`)
        : `As the Pixie, change into the character you were mad as.`,
  },
  {
    id: "poppy_grower_deaths_before_wake",
    category: "role",
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
            event.event_type === GrimoireEventType.DEATH &&
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
          ? `As the Poppy Grower, you've reached ${count} deaths before dying and waking evil.`
          : `As the Poppy Grower, this player has reached ${count} deaths before dying and waking evil.`)
        : `As the Poppy Grower, die after deaths so evil wakes.`,
  },
  {
    id: "preacher_chosen",
    category: "role",
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
          ? `As the Preacher, you've chosen ${count} minion${pluralize(count)} with your ability.`
          : `As the Preacher, this player has chosen ${count} minion${pluralize(count)} with their ability.`)
        : `As the Preacher, choose a minion with your ability.`,
  },
  {
    id: "preacher_highest_count",
    category: "role",
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
          ? `As the Preacher, you've reached a total of ${count} chosen minion${pluralize(count)} in a single game.`
          : `As the Preacher, this player has reached a total of ${count} chosen minion${pluralize(count)} in a single game.`)
        : `As the Preacher, choose multiple minions with your ability in a single game.`,
  },
  {
    id: "preacher_chosen_received",
    category: "role",
    script: "experimental",
    roleIds: ["preacher"],
    source: "grimoire_event",
    label: "Chosen for the Sermon",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(games, username, (game, event) => {
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
          ? `You've been chosen as a minion by the Preacher ${count} time${pluralize(count)}.`
          : `This player has been chosen as a minion by the Preacher ${count} time${pluralize(count)}.`)
        : `Be chosen as a minion by the Preacher due to their ability.`,
  },
  {
    id: "princess_kills_prevented",
    category: "role",
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
          ? `As the Princess, you've prevented a Demon from killing ${count} time${pluralize(count)} due to your ability.`
          : `As the Princess, this player has prevented a Demon from killing ${count} time${pluralize(count)} due to their ability.`)
        : `As the Princess, prevent a Demon from killing due to your ability.`,
  },
  {
    id: "princess_kills_prevented_received",
    category: "role",
    roleIds: ["princess"],
    script: "experimental",
    source: "grimoire_event",
    label: "Silenced by Decree",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(games, username, (_, event) => {
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
  },
  {
    id: "professor_revives",
    category: "role",
    roleIds: ["professor"],
    script: "bmr",
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
  },
  // Ravenkeeper: No reminder token(s) to track, would have been cool to track how many times they picked the demon.
  // Sage: No reminder token(s) and nothing to track really.
  {
    id: "sailor_drunk",
    category: "role",
    roleIds: ["sailor"],
    script: "bmr",
    source: "grimoire_event",
    label: "Shared Bottle",
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
          ? `As the Sailor, you've made another player drunk ${count} time${pluralize(count)}.`
          : `As the Sailor, this player has made another player drunk ${count} time${pluralize(count)}.`)
        : `As the Sailor, make another player drunk.`,
  },
  {
    id: "sailor_self_drunk",
    category: "role",
    roleIds: ["sailor"],
    script: "bmr",
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
  },
  // Savant: No reminder token(s) and nothing to track really.
  // Seamstress: No reminder token(s) and nothing to track really.
  // Shugenja: No reminder token(s) and nothing to track really.
  {
    id: "slayer_kills",
    category: "role",
    roleIds: ["slayer"],
    script: "tb",
    source: "grimoire_event",
    label: "Bullseye",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Slayer, you've killed ${count} player${pluralize(count)} with your shot.`
          : `As the Slayer, this player has killed ${count} player${pluralize(count)} with their shot.`)
        : `As the Slayer, kill a player with your ability.`,
  },
  {
    id: "slayer_game_ending_kills",
    category: "role",
    roleIds: ["slayer"],
    script: "tb",
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
      count > 0
        ? (isMe
          ? `As the Slayer, you've ended the game with your shot ${count} time${pluralize(count)}.`
          : `As the Slayer, this player has ended the game with their shot ${count} time${pluralize(count)}.`)
        : `As the Slayer, end a game with your ability.`,
  },
  {
    id: "slayer_recluse_kills",
    category: "role",
    roleIds: ["slayer"],
    script: "tb",
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
          ? `As the Slayer, you've killed the Recluse with your shot ${count} time${pluralize(count)}.`
          : `As the Slayer, this player has killed the Recluse with their shot ${count} time${pluralize(count)}.`)
        : `As the Slayer, kill the Recluse with your ability.`,
  },
  {
    id: "snake_charmer_demon_charms",
    category: "role",
    roleIds: ["snake_charmer"],
    script: "snv",
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
          ? `As the Snake Charmer, you've successfully charmed the demon ${count} time${pluralize(count)}.`
          : `As the Snake Charmer, this player has successfully charmed the demon ${count} time${pluralize(count)}.`)
        : `As the Snake Charmer, successfully charm the demon using your ability.`,
  },
  {
    id: "snake_charmer_post_charm_win_rate",
    category: "role",
    roleIds: ["snake_charmer"],
    script: "snv",
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
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Snake Charmer, you've won ${count}% of games where you charmed the demon.`
          : `As the Snake Charmer, this player has won ${count}% of games where they charmed the demon.`)
        : `As the Snake Charmer, win a game after charming the demon.`,
  },
  {
    id: "snake_charmer_demon_charms_received",
    category: "role",
    roleIds: ["snake_charmer"],
    script: "snv",
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
      count > 0
        ? (isMe
          ? `As a Demon, you've been charmed by the Snake Charmer ${count} time${pluralize(count)}.`
          : `As a Demon, this player has been charmed by the Snake Charmer ${count} time${pluralize(count)}.`)
        : `As a Demon, be charmed by the Snake Charmer.`,
  },
  {
    id: "choirboy_demon_reveals",
    category: "role",
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
              event.status_source !== "Shown"
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
          ? `As the Choirboy, you've learned the Demon ${count} time${pluralize(count)} due to your ability when the King was killed.`
          : `As the Choirboy, this player has learned the Demon ${count} time${pluralize(count)} due to their ability when the King was killed.`)
        : `As the Choirboy, learn the Demon due to your ability when the King is killed.`,
  },
  {
    id: "choirboy_demon_reveals_received",
    category: "role",
    roleIds: ["choirboy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Royal Suspect",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(games, username, (game, event) => {
        if (
          event.by_role_id !== "choirboy" ||
          event.event_type !== GrimoireEventType.OTHER ||
          event.status_source !== "Shown"
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
          ? `You've been revealed to the Choirboy as the Demon ${count} time${pluralize(count)}.`
          : `This player has been revealed to the Choirboy as the Demon ${count} time${pluralize(count)}.`)
        : `As the Demon, be shown to the Choirboy after you kill the King.`,
  },
  {
    id: "soldier_saved_from_demon_kill",
    category: "role",
    roleIds: ["soldier"],
    script: "tb",
    source: "grimoire_event",
    label: "Battle-Hardened",
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
          ? `As the Soldier, you've survived a Demon attack ${count} time${pluralize(count)} due to your ability.`
          : `As the Soldier, this player has survived a Demon attack ${count} time${pluralize(count)} due to their ability.`)
        : `As the Soldier, survive a Demon attack due to your ability.`,
  },
  // Steward: @todo (Shown you?)
  {
    id: "tea_lady_saved_players",
    category: "role",
    roleIds: ["tea_lady"],
    script: "bmr",
    source: "grimoire_event",
    label: "Safe in Company",
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
          ? `As the Tea Lady, you've saved ${count} player${pluralize(count)}.`
          : `As the Tea Lady, this player has saved ${count} player${pluralize(count)}.`)
        : `As the Tea Lady, save a player.`,
  },
  // Town Crier: Nothing to track really.
  // Undertaker: @todo
  {
    id: "village_idiot_drunk_received",
    category: "role",
    roleIds: ["village_idiot"],
    script: "experimental",
    source: "grimoire_event",
    label: "Biggest Idiot",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "village_idiot"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been the drunk Village Idiot ${count} time${pluralize(count)}.`
          : `This player has been the drunk Village Idiot ${count} time${pluralize(count)}.`)
        : `Be the drunk Village Idiot.`,
  },
  {
    id: "virgin_executions",
    category: "role",
    roleIds: ["virgin"],
    script: "tb",
    source: "grimoire_event",
    label: "Unblemished",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Virgin, you've caused ${count} immediate execution${pluralize(count)} by being nominated.`
          : `As the Virgin, this player has caused ${count} immediate execution${pluralize(count)} by being nominated.`)
        : `As the Virgin, cause an immediate execution due to your ability.`,
  },
  {
    id: "virgin_spy_executions",
    category: "role",
    script: "tb",
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
      count > 0
        ? (isMe
          ? `As the Virgin, you've caused the Spy to be executed ${count} time${pluralize(count)} when they nominated you.`
          : `As the Virgin, this player has caused the Spy to be executed ${count} time${pluralize(count)} when they nominated them.`)
        : `As the Virgin, cause the Spy to be executed by your ability.`,
  },
  // Washerwoman: @todo (Spy)
];
