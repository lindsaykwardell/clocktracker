import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
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
  getMostCommonEndTriggerRole,
  getMostCommonEndTriggerRoleSubtitle,
  isDemonKillEvent,
  pluralize,
  wasWere,
} from "./shared";
import type { RoleStatCardDefinition } from "./shared";

export const MINIONS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "assassin_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["assassin"],
    script: "bmr",
    sao: 3,
    source: "grimoire_event",
    label: "Certain Death",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Assassin, you've killed ${count} player${pluralize(count)}.`
          : `As the Assassin, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Assassin, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by an Assassin.`
        : `No Assassin has killed a player yet.`,
  },
  {
    id: "assassin_evil_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["assassin"],
    script: "bmr",
    sao: 3,
    hidden: true,
    source: "grimoire_event",
    label: "Friendly Fire",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
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
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Assassin, you've killed ${count} evil player${pluralize(count)}.`
          : `As the Assassin, this player has killed ${count} evil player${pluralize(count)}.`)
        : `As the Assassin, kill an evil player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} evil player${pluralize(count)} ${wasWere(count)} killed by an Assassin.`
        : `No Assassin has killed an evil player yet.`,
  },
  {
    id: "assassin_demon_kills_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["assassin"],
    script: "bmr",
    sao: 3,
    hidden: true,
    source: "end_trigger",
    label: "Et Tu, Brute?",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Assassin, you've ended ${count} game${pluralize(count)} by killing the Demon.`
          : `As the Assassin, this player has ended ${count} game${pluralize(count)} by killing the Demon.`)
        : `As the Assassin, end a game by killing the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by an Assassin killing the Demon.`
        : `No Assassin has ended a game by killing the Demon yet.`,
  },
  // Baron sao: 3,: Nothing to track really.
  // Boffin: @todo Some end triggers?
  {
    id: "boomdandy_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["boomdandy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Kaboom!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Boomdandy, you've killed ${count} player${pluralize(count)}.`
          : `As the Boomdandy, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Boomdandy, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Boomdandy.`
        : `No Boomdandy has killed a player yet.`,
  },
  {
    id: "boomdandy_max_page_kills",
    category: "role",
    scope: "as_role",
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
          ? `As the Boomdandy, your largest explosion killed ${count} player${pluralize(count)} at once.`
          : `As the Boomdandy, this player's largest explosion killed ${count} player${pluralize(count)} at once.`)
        : `As the Boomdandy, kill multiple players at once.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The largest Boomdandy explosion killed ${count} player${pluralize(count)} at once.`
        : `No Boomdandy has killed multiple players at once yet.`,
  },
  {
    id: "cerenovus_madness_applied",
    category: "role",
    scope: "as_role",
    roleIds: ["cerenovus"],
    script: "snv",
    sao: 3,
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
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} made mad by a Cerenovus.`
        : `No Cerenovus has made a player mad yet.`,
  },
  {
    id: "cerenovus_executions",
    category: "role",
    scope: "as_role",
    roleIds: ["cerenovus"],
    script: "snv",
    sao: 3,
    source: "grimoire_event",
    label: "Forced Compliance",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cerenovus, you've caused ${count} execution${pluralize(count)} for breaking madness.`
          : `As the Cerenovus, this player has caused ${count} execution${pluralize(count)} for breaking madness.`)
        : `As the Cerenovus, cause an execution for breaking madness.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} execution${pluralize(count)} ${wasWere(count)} caused by a Cerenovus for breaking madness.`
        : `No Cerenovus has caused an execution for breaking madness yet.`,
  },
  {
    id: "cerenovus_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["cerenovus"],
    script: "snv",
    sao: 3,
    source: "end_trigger",
    label: "Mad Finale",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
          game.end_trigger_type === GameEndTriggerType.EXECUTION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cerenovus, you've caused ${count} game${pluralize(count)} to end by an execution for breaking madness, leaving only two players alive.`
          : `As the Cerenovus, this player has caused ${count} game${pluralize(count)} to end by an execution for breaking madness, leaving only two players alive.`)
        : `As the Cerenovus, cause a game to end by an execution for breaking madness, leaving only two players alive.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Cerenovus causing an execution for breaking madness, leaving only two players alive.`
        : `No Cerenovus has ended a game by causing an execution for breaking madness yet.`,
  },
  {
    id: "devils_advocate_saves",
    category: "role",
    scope: "as_role",
    roleIds: ["devils_advocate"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Appeal Granted",
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
          ? `As the Devil's Advocate, you've saved ${count} player${pluralize(count)} from execution.`
          : `As the Devil's Advocate, this player has saved ${count} player${pluralize(count)} from execution.`)
        : `As the Devil's Advocate, save a player from execution.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} saved from execution by a Devil's Advocate.`
        : `No Devil's Advocate has saved a player from execution yet.`,
  },
  {
    id: "devils_advocate_demon_saves",
    category: "role",
    scope: "as_role",
    roleIds: ["devils_advocate"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Client Privilege",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Saved"
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
          ? `As the Devil's Advocate, you've saved the Demon from execution ${count} time${pluralize(count)}.`
          : `As the Devil's Advocate, this player has saved the Demon from execution ${count} time${pluralize(count)}.`)
        : `As the Devil's Advocate, save the Demon from execution.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The Demon has been saved from execution by a Devil's Advocate at least ${count} time${pluralize(count)}.`
        : `No Demon has been saved from execution by a Devil's Advocate yet.`,
  },
  // Devil's Advocate: Maybe how many times they protected a good player?
  {
    id: "evil_twin_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["evil_twin"],
    script: "snv",
    sao: 1,
    source: "end_trigger",
    label: "Family Feud",
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
          ? `As the Evil Twin, you've caused ${count} game${pluralize(count)} to end when your twin was killed.`
          : `As the Evil Twin, this player has caused ${count} game${pluralize(count)} to end when their twin was killed.`)
        : `As the Evil Twin, cause a game to end when your twin is killed.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by an Evil Twin when their twin was killed.`
        : `No Evil Twin has ended a game when their twin was killed yet.`,
  },
  {
    id: "fearmonger_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["fearmonger"],
    script: "experimental",
    source: "end_trigger",
    label: "Fear Decides",
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
          ? `As the Fearmonger, you've ended ${count} game${pluralize(count)} by nominating and executing your chosen player.`
          : `As the Fearmonger, this player has ended ${count} game${pluralize(count)} by nominating and executing their chosen player.`)
        : `As the Fearmonger, end a game by nominating and executing your chosen player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Fearmonger nominating and executing their chosen player.`
        : `No Fearmonger has ended a game by nominating and executing their chosen player yet.`,
  },
  {
    id: "goblin_ability_wins",
    category: "role",
    scope: "as_role",
    roleIds: ["goblin"],
    script: "experimental",
    source: "end_trigger",
    label: "Last Laugh",
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
          ? `As the Goblin, you've caused ${count} game${pluralize(count)} to end by being executed after claiming Goblin.`
          : `As the Goblin, this player has caused ${count} game${pluralize(count)} to end by being executed after claiming Goblin.`)
        : `As the Goblin, cause a game to end by being executed after claiming Goblin.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Goblin being executed after claiming Goblin.`
        : `No Goblin has ended a game by being executed after claiming Goblin yet.`,
  },
  {
    id: "goblin_executions_caused",
    category: "role",
    roleIds: ["goblin"],
    scope: "triggering_player",
    script: "experimental",
    hidden: true,
    source: "grimoire_event",
    label: "Called the Bluff",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (event.event_type !== GrimoireEventType.EXECUTION) return false;

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);
        const isGoblinExecution =
          currentToken?.role_id === "goblin" || previousToken?.role_id === "goblin";
        if (!isGoblinExecution) return false;

        return game.grimoire_events.some(
          (marker) =>
            marker.by_role_id === "goblin" &&
            marker.event_type === GrimoireEventType.OTHER &&
            marker.status_source === "Claimed" &&
            marker.grimoire_page === event.grimoire_page &&
            marker.participant_id === event.participant_id
        );
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've executed a claimed Goblin ${count} time${pluralize(count)}.`
          : `This player has executed a claimed Goblin ${count} time${pluralize(count)}.`)
        : `Execute a claimed Goblin.`,
    getSubtitle: ({ games, isMe }) => {
      let total = 0;
      let wins = 0;

      for (const game of games) {
        if (game.ignore_for_stats || game.win_v2 === WinStatus_V2.NOT_RECORDED) continue;
        const alignment = game.player_characters.at(-1)?.alignment ?? null;

        for (const event of game.grimoire_events) {
          if (event.event_type !== GrimoireEventType.EXECUTION) continue;

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);
          const isGoblinExecution =
            currentToken?.role_id === "goblin" || previousToken?.role_id === "goblin";
          if (!isGoblinExecution) continue;

          const hasClaimedMarker = game.grimoire_events.some(
            (marker) =>
              marker.by_role_id === "goblin" &&
              marker.event_type === GrimoireEventType.OTHER &&
              marker.status_source === "Claimed" &&
              marker.grimoire_page === event.grimoire_page &&
              marker.participant_id === event.participant_id
          );
          if (!hasClaimedMarker) continue;

          total += 1;

          if (
            (alignment === "GOOD" && game.win_v2 === WinStatus_V2.GOOD_WINS) ||
            (alignment === "EVIL" && game.win_v2 === WinStatus_V2.EVIL_WINS)
          ) {
            wins += 1;
          }
        }
      }

      if (total === 0) return null;
      return `${isMe ? "You've" : "This player has"} won ${wins} of ${total} recorded results.`;
    },
  },
  {
    id: "godfather_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["godfather"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Sleeping with the Fishes",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Godfather, you've killed ${count} player${pluralize(count)}.`
          : `As the Godfather, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Godfather, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Godfather.`
        : `No Godfather has killed a player yet.`,
  },
  {
    id: "godfather_demon_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["godfather"],
    script: "bmr",
    hidden: true,
    source: "end_trigger",
    label: "Betrayal in the Family",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Godfather, you've ended ${count} game${pluralize(count)} by killing the Demon.`
          : `As the Godfather, this player has ended ${count} game${pluralize(count)} by killing the Demon.`)
        : `As the Godfather, end a game by killing the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Godfather killing the Demon.`
        : `No Godfather has ended a game by killing the Demon yet.`,
  },
  {
    id: "harpy_madness",
    category: "role",
    scope: "as_role",
    roleIds: ["harpy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Foul Presence",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.MAD),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harpy, you've made ${count} player${pluralize(count)} mad.`
          : `As the Harpy, this player has made ${count} player${pluralize(count)} mad.`)
        : `As the Harpy, make a player mad.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} made mad by a Harpy.`
        : `No Harpy has made a player mad yet.`,
  },
  {
    id: "harpy_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["harpy"],
    script: "experimental",
    source: "grimoire_event",
    label: "Maddening Carnage",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harpy, you've caused ${count} death${pluralize(count)} for breaking madness.`
          : `As the Harpy, this player has caused ${count} death${pluralize(count)} for breaking madness.`)
        : `As the Harpy, cause a player to die for breaking madness.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} death${pluralize(count)} ${wasWere(count)} caused by a Harpy for breaking madness.`
        : `No Harpy has caused a death for breaking madness yet.`,
  },
  {
    id: "harpy_game_ending",
    category: "role",
    scope: "as_role",
    roleIds: ["harpy"],
    script: "experimental",
    source: "end_trigger",
    label: "Shrieking End",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
          game.end_trigger_type === GameEndTriggerType.EXECUTION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harpy, you've caused ${count} game${pluralize(count)} to end by causing an execution for breaking madness, leaving only two players alive.`
          : `As the Harpy, this player has caused ${count} game${pluralize(count)} to end by causing an execution for breaking madness, leaving only two players alive.`)
        : `As the Harpy, cause a game to end by causing an execution for breaking madness, leaving only two players alive.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Harpy causing an execution for breaking madness, leaving only two players alive.`
        : `No Harpy has ended a game by causing an execution for breaking madness yet.`,
  },
  // Marionette: Nothing relevant. Only option: None?
  {
    id: "mastermind_game_ending",
    category: "role",
    scope: "as_role",
    roleIds: ["mastermind"],
    script: "bmr",
    sao: 4,
    source: "end_trigger",
    label: "Planned Finale",
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
          ? `As the Mastermind, you've caused ${count} game${pluralize(count)} to end when an execution occurred on the final day.`
          : `As the Mastermind, this player has caused ${count} game${pluralize(count)} to end when an execution occurred on the final day.`)
        : `As the Mastermind, cause a game to end when an execution occurred on the final day.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Mastermind when an execution occurred on the final day.`
        : `No Mastermind has ended a game when an execution occurred on the final day yet.`,
  },
  // {
  //   id: "mastermind_ability_wins",
  //   category: "role",
  //   scope: "as_role",
  //   roleIds: ["mastermind"],
  //   script: "bmr",
  //   sao: 4,
  //   source: "end_trigger",
  //   label: "Perfect Scheme",
  //   getCount: ({ games, roleId }) =>
  //     // After a Mastermind-triggered ending, this tracks EVIL_WINS as the
  //     // typical case. It intentionally ignores rare edge cases where alignment
  //     // could differ, to keep this stat simple and consistent.
  //     games.filter(
  //       (game) =>
  //         !game.ignore_for_stats &&
  //         !!roleId &&
  //         game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
  //         game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
  //         game.end_trigger_role_id === roleId &&
  //         game.win_v2 === WinStatus_V2.EVIL_WINS
  //     ).length,
  //   getSentence: ({ count, isMe }) =>
  //     count > 0
  //       ? (isMe
  //         ? `As the Mastermind, you've won ${count} game${pluralize(count)} where your ability ended the game.`
  //         : `As the Mastermind, this player has won ${count} game${pluralize(count)} where their ability ended the game.`)
  //       : `As the Mastermind, win a game where your ability ends the game.`,
  // },
  {
    id: "mezepheles_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["mezepheles"],
    script: "experimental",
    source: "grimoire_event",
    label: "A Word, Please?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mezepheles, you've changed the alignment of ${count} player${pluralize(count)}.`
          : `As the Mezepheles, this player has changed the alignment of ${count} player${pluralize(count)}.`)
        : `As the Mezepheles, change the alignment of a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} changed by a Mezepheles.`
        : `No Mezepheles has changed a player's alignment yet.`,
  },
  {
    id: "mezepheles_changes_received",
    category: "role",
    roleIds: ["mezepheles"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "The Forbidden Word",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.ALIGNMENT_CHANGE &&
          event.by_role_id === "mezepheles"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've changed alignment due to the Mezepheles ${count} time${pluralize(count)}.`
          : `This player changed alignment due to the Mezepheles ${count} time${pluralize(count)}.`)
        : `Change alignment due to the Mezepheles.`,
  },
  {
    id: "organ_grinder_drunk",
    category: "role",
    scope: "as_role",
    roleIds: ["organ_grinder"],
    script: "experimental",
    source: "grimoire_event",
    label: "Drank the Music",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.DRUNK &&
              !!event.by_participant_id &&
              event.participant_id === event.by_participant_id
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Organ Grinder, you've chosen to become drunk ${count} time${pluralize(count)}.`
          : `As the Organ Grinder, this player has chosen to become drunk ${count} time${pluralize(count)}.`)
        : `As the Organ Grinder, choose to become drunk.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Organ Grinder has chosen to become drunk at least ${count} time${pluralize(count)}.`
        : `No Organ Grinder has chosen to become drunk yet.`,
  },
  {
    id: "pit_hag_role_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["pit-hag"],
    script: "snv",
    sao: 4,
    source: "grimoire_event",
    label: "Cauldron's Work",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've changed ${count} player${pluralize(count)} into a different character.`
          : `As the Pit-Hag, this player has changed ${count} player${pluralize(count)} into a different character.`)
        : `As the Pit-Hag, change a player into a different character.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} changed into a different character by a Pit-Hag.`
        : `No Pit-Hag has changed a player into a different character yet.`,
  },
  {
    id: "pit_hag_demon_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["pit-hag"],
    script: "snv",
    sao: 4,
    source: "grimoire_event",
    label: "Demon Decanted",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
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
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've changed the Demon into another Demon ${count} time${pluralize(count)}.`
          : `As the Pit-Hag, this player has changed the Demon into another Demon ${count} time${pluralize(count)}.`)
        : `As the Pit-Hag, change the Demon into another Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Demon${pluralize(count)} ${wasWere(count)} changed into a different Demon by a Pit-Hag.`
        : `No Pit-Hag has changed the Demon into another Demon yet.`,
  },
  {
    id: "pit_hag_self_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["pit-hag"],
    script: "snv",
    sao: 4,
    source: "grimoire_event",
    label: "Self-Transformation",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
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
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've changed yourself ${count} time${pluralize(count)}.`
          : `As the Pit-Hag, this player has changed themselves ${count} time${pluralize(count)}.`)
        : `As the Pit-Hag, change yourself into a different character.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Pit-Hag has changed themselves into a different character at least ${count} time${pluralize(count)}.`
        : `No Pit-Hag has changed themselves yet.`,
  },
  {
    id: "pit_hag_good_demons",
    category: "role",
    scope: "as_role",
    roleIds: ["pit-hag"],
    script: "snv",
    sao: 4,
    hidden: true,
    source: "grimoire_event",
    label: "Monstrous Creations",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
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
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pit-Hag, you've created ${count} good Demon${pluralize(count)}.`
          : `As the Pit-Hag, this player has created ${count} good Demon${pluralize(count)}.`)
        : `As the Pit-Hag, create a good Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} good Demon${pluralize(count)} ${wasWere(count)} created by a Pit-Hag.`
        : `No Pit-Hag has created a good Demon yet.`,
  },
  {
    id: "pit_hag_accidental_game_ending",
    category: "role",
    scope: "as_role",
    roleIds: ["pit-hag"],
    script: "snv",
    hidden: true,
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
          ? `As the Pit-Hag, you've caused ${count} game${pluralize(count)} to end by removing the last living Demon.`
          : `As the Pit-Hag, this player has caused ${count} games${pluralize(count)} to end by removing the last living Demon.`)
        : `As the Pit-Hag, end a game by removing the last living Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended after a Pit-Hag removed the last living Demon.`
        : `No Pit-Hag has ended a game by removing the last living Demon yet.`,
  },
  {
    id: "pit_hag_changes_received",
    category: "role",
    roleIds: ["pit-hag"],
    scope: "affected_player",
    script: "snv",
    sao: 4,
    source: "grimoire_event",
    label: "Dropped in the Cauldron",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          (event.by_role_id === "pit-hag" || event.by_role_id === "pit_hag")
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into a different character by the Pit-Hag ${count} time${pluralize(count)}.`
          : `This player has been changed into a different character by the Pit-Hag ${count} time${pluralize(count)}.`)
        : `Be changed into a different character by the Pit-Hag.`,
  },
  {
    id: "poisoner_poisons",
    category: "role",
    scope: "as_role",
    roleIds: ["poisoner"],
    script: "tb",
    sao: 1,
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
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} poisoned by a Poisoner.`
        : `No Poisoner has poisoned a player yet.`,
  },
  {
    id: "psychopath_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["psychopath"],
    script: "experimental",
    source: "grimoire_event",
    label: "Here's Johnny!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Psychopath, you've killed ${count} player${pluralize(count)}.`
          : `As the Psychopath, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Psychopath, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Psychopath.`
        : `No Psychopath has killed a player yet.`,
  },
  {
    id: "psychopath_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["psychopath"],
    script: "experimental",
    source: "end_trigger",
    label: "Final Swing",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
          game.end_trigger_type === GameEndTriggerType.DEATH &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Psychopath, you've caused ${count} game${pluralize(count)} to end by killing a player, leaving only two players alive.`
          : `As the Psychopath, this player has caused ${count} game${pluralize(count)} to end by killing a player, leaving only two players alive.`)
        : `As the Psychopath, end a game by killing a player, leaving only two players alive.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Psychopath killing a player, leaving only two players alive.`
        : `No Psychopath has ended a game by killing a player and leaving only two players alive yet.`,
  },
  {
    id: "psychopath_demon_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["psychopath"],
    script: "experimental",
    hidden: true,
    source: "end_trigger",
    label: "Hell-Fire Axe",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Psychopath, you've caused ${count} game${pluralize(count)} to end by killing the Demon.`
          : `As the Psychopath, this player has caused ${count} game${pluralize(count)} to end by killing the Demon.`)
        : `As the Psychopath, end a game by killing the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Psychopath killing the Demon.`
        : `No Psychopath has ended a game by killing the Demon yet.`,
  },
  {
    id: "scarlet_woman_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["scarlet_woman"],
    sao: 4,
    script: "tb",
    source: "grimoire_event",
    label: "The New Master",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              (event.event_type === GrimoireEventType.ROLE_CHANGE ||
                (event.event_type === GrimoireEventType.OTHER &&
                  event.status_source === "Is The Demon"))
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Scarlet Woman, you've become a Demon ${count} time${pluralize(count)}.`
          : `As the Scarlet Woman, this player has become a Demon ${count} time${pluralize(count)}.`)
        : `As the Scarlet Woman, become a demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Scarlet Woman has become a Demon at least ${count} time${pluralize(count)}.`
        : `No Scarlet Woman has become a Demon yet.`,
  },
  {
    id: "spy_washerwoman_received",
    category: "role",
    scope: "affected_player",
    script: "tb",
    roleIds: ["spy"],
    sao: 2,
    source: "grimoire_event",
    label: "Clean Alibi",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (
          event.by_role_id !== "washerwoman" ||
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
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Spy, you've been seen as Townsfolk by the Washerwoman ${count} time${pluralize(count)}.`
          : `As the Spy, this player has been seen as Townsfolk by the Washerwoman ${count} time${pluralize(count)}.`)
        : `As the Spy, be seen as Townsfolk by the Washerwoman.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as Townsfolk by a Washerwoman at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as Townsfolk by a Washerwoman yet.`,
  },
  {
    id: "spy_librarian_received",
    category: "role",
    scope: "affected_player",
    script: "tb",
    roleIds: ["spy"],
    sao: 2,
    source: "grimoire_event",
    label: "Forged Library Card",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
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
          ? `As the Spy, you've been seen as Outsider by the Librarian ${count} time${pluralize(count)}.`
          : `As the Spy, this player has been seen as Outsider by the Librarian ${count} time${pluralize(count)}.`)
        : `As the Spy, be seen as Outsider by the Librarian.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as an Outsider by a Librarian at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as an Outsider by a Librarian yet.`,
  },
  {
    id: "spy_steward_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["spy"],
    source: "grimoire_event",
    label: "A Good-Looking Cover",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (
          event.by_role_id !== "steward" ||
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
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Spy, you've been seen as Good by the Steward ${count} time${pluralize(count)}.`
          : `As the Spy, this player has been seen as Good by the Steward ${count} time${pluralize(count)}.`)
        : `As the Spy, be seen as Good by the Steward.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been seen as Good by a Steward at least ${count} time${pluralize(count)}.`
        : `No Spy has been seen as Good by a Steward yet.`,
  },
  {
    id: "spy_virgin_received",
    category: "role",
    scope: "as_role",
    script: "tb",
    sao: 2,
    roleIds: ["spy"],
    hidden: true,
    source: "grimoire_event",
    label: "Maiden Fooled",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.event_type !== GrimoireEventType.EXECUTION ||
              (event.by_role_id !== "virgin" &&
                event.status_source !== "Executed")
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
          ? `As the Spy, you've been executed ${count} time${pluralize(count)} when nominating the Virgin.`
          : `As the Spy, this player has been executed ${count} time${pluralize(count)} when nominating the Virgin.`)
        : `As the Spy, be executed when nominating the Virgin.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been executed when nominating a Virgin at least ${count} time${pluralize(count)}.`
        : `No Spy has been executed when nominating a Virgin yet.`,
  },
  {
    id: "spy_moonchild_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["spy"],
    source: "grimoire_event",
    label: "Stars Misaligned",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.DEATH ||
            event.by_role_id !== "moonchild"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);

          return (
            currentToken?.role_id === "spy" ||
            previousToken?.role_id === "spy"
          );
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Spy, you've been killed by the Moonchild ${count} time${pluralize(count)} due to misregistering as Good.`
          : `As the Spy, this player has been killed by the Moonchild ${count} time${pluralize(count)} due to misregistering as Good.`)
        : `As the Spy, be killed by the Moonchild due to misregistering as Good.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been killed by a Moonchild due to misregistering as Good at least ${count} time${pluralize(count)}.`
        : `No Spy has been killed by a Moonchild due to misregistering as Good yet.`,
  },
  {
    id: "spy_lycanthrope_received",
    category: "role",
    scope: "affected_player",
    script: "experimental",
    roleIds: ["spy"],
    source: "grimoire_event",
    label: "Full Moon Mishap",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.DEATH ||
            event.by_role_id !== "lycanthrope"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          const previousToken = getEventPreviousToken(game, event);

          return (
            currentToken?.role_id === "spy" ||
            previousToken?.role_id === "spy"
          );
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Spy, you've been killed by the Lycanthrope ${count} time${pluralize(count)} due to misregistering as Good.`
          : `As the Spy, this player has been killed by the Lycanthrope ${count} time${pluralize(count)} due to misregistering as Good.`)
        : `As the Spy, be killed by the Lycanthrope due to misregistering as Good.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been killed by a Lycanthrope due to misregistering as Good at least ${count} time${pluralize(count)}.`
        : `No Spy has been killed by a Lycanthrope due to misregistering as Good yet.`,
  },
  {
    id: "summoner_changes",
    category: "role",
    scope: "as_role",
    roleIds: ["summoner"],
    script: "experimental",
    source: "grimoire_event",
    label: "The Ritual Complete",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Summoner, you've successfully summoned ${count} Demon${pluralize(count)}.`
          : `As the Summoner, this player has successfully summoned ${count} Demon${pluralize(count)}.`)
        : `As the Summoner, successfully summon a Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Demon${pluralize(count)} ${wasWere(count)} summoned by a Summoner.`
        : `No Summoner has summoned a Demon yet.`,
  },
  {
    id: "summoner_changes_received",
    category: "role",
    roleIds: ["summoner"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Summoned to Darkness",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
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
          ? `You've been changed into a Demon by the Summoner ${count} time${pluralize(count)}.`
          : `This player has been changed into a Demon by the Summoner ${count} time${pluralize(count)}.`)
        : `Be changed into a Demon by the Summoner.`,
  },
  // Summoner: @todo Game ends
  {
    id: "vizier_executions",
    category: "role",
    scope: "as_role",
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
          : `As the Vizier, this player has forced ${count} execution${pluralize(count)}.`)
        : `As the Vizier, force an execution.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} execution${pluralize(count)} ${wasWere(count)} forced by a Vizier.`
        : `No Vizier has forced an execution yet.`,
  },
  {
    id: "vizier_killed_by_demon",
    category: "role",
    scope: "as_role",
    roleIds: ["vizier"],
    script: "experimental",
    source: "grimoire_event",
    label: "Courtly Assassination",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
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
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vizier, you've been killed by the Demon ${count} time${pluralize(count)}.`
          : `As the Vizier, this player has been killed by the Demon ${count} time${pluralize(count)}.`)
        : `As the Vizier, be killed by the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Vizier has been killed by the Demon at least ${count} time${pluralize(count)}.`
        : `No Vizier has been killed by the Demon yet.`,
  },
  {
    id: "vizier_executions_received",
    category: "role",
    roleIds: ["vizier"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Forced to the Gallows",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.EXECUTION &&
          event.by_role_id === "vizier"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `The Vizier forced your execution ${count} time${pluralize(count)}.`
          : `The Vizier forced this player's execution ${count} time${pluralize(count)}.`)
        : `Have the Vizier force your execution.`,
  },
  {
    id: "vizier_demon_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["vizier"],
    script: "experimental",
    hidden: true,
    source: "end_trigger",
    label: "Edict Backfired", // @todo Revisit
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.NO_LIVING_DEMON &&
          game.end_trigger_type === GameEndTriggerType.EXECUTION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vizier, you've ended ${count} game${pluralize(count)} by forcing the Demon's execution.`
          : `As the Vizier, this player has ended ${count} game${pluralize(count)} by forcing the Demon's execution.`)
        : `As the Vizier, end a game by forcing the Demon's execution.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Vizier forcing the Demon's execution.`
        : `No Vizier has ended a game by forcing the Demon's execution yet.`,
  },
  {
    id: "vizier_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["vizier"],
    script: "experimental",
    source: "end_trigger",
    label: "Final Decree",
    getCount: ({ games, roleId }) =>
      games.filter(
        (game) =>
          !game.ignore_for_stats &&
          !!roleId &&
          game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
          game.end_trigger_type === GameEndTriggerType.EXECUTION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === roleId
      ).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vizier, you've ended ${count} game${pluralize(count)} by forcing an execution, leaving only two players alive.`
          : `As the Vizier, this player has ended ${count} game${pluralize(count)} by forcing an execution, leaving only two players alive.`)
        : `As the Vizier, end a game by forcing an execution, leaving only two players alive.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Vizier forcing an execution, leaving only two players alive.`
        : `No Vizier has ended a game by forcing an execution and leaving only two players alive yet.`,
  },
  {
    id: "widow_poisoned",
    category: "role",
    scope: "as_role",
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
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} poisoned by a Widow.`
        : `No Widow has poisoned a player yet.`,
  },
  {
    id: "widow_self_poisoned",
    category: "role",
    scope: "as_role",
    roleIds: ["widow"],
    script: "experimental",
    source: "grimoire_event",
    label: "Keep It Secret, Keep It Safe",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.POISONED &&
              !!event.by_participant_id &&
              event.participant_id === event.by_participant_id
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Widow, you've chosen to poison yourself ${count} time${pluralize(count)}.`
          : `As the Widow, this player has chosen to poison themselves ${count} time${pluralize(count)}.`)
        : `As the Widow, choose to poison yourself.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Widow has chosen to poison themselves at least ${count} time${pluralize(count)}.`
        : `No Widow has chosen to poison themselves yet.`,
  },
  {
    id: "witch_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["witch"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Death Curse",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Witch, you've caused ${count} player${pluralize(count)} to die.`
          : `As the Witch, this player has caused ${count} player${pluralize(count)} to die.`)
        : `As the Witch, cause a player to die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Witch.`
        : `No Witch has killed a player yet.`,
  },
  {
    id: "witch_demon_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["witch"],
    script: "snv",
    sao: 2,
    hidden: true,
    source: "end_trigger",
    label: "Curse Recoiled",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : games.filter((game) => {
            if (
              game.ignore_for_stats ||
              game.end_trigger_cause !== GameEndTriggerCause.ABILITY ||
              game.end_trigger_role_id !== roleId ||
              !game.end_trigger_participant_id
            ) {
              return false;
            }

            if (game.end_trigger !== GameEndTrigger.NO_LIVING_DEMON) {
              return false;
            }
            return true;
          }).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Witch, you've caused ${count} game${pluralize(count)} to end by causing the Demon to die.`
          : `As the Witch, this player has caused ${count} game${pluralize(count)} to end by causing the Demon to die.`)
        : `As the Witch, cause a game to end by causing the Demon to die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Witch causing the Demon to die.`
        : `No Witch has ended a game by causing the Demon to die yet.`,
  },
  // Wizard: Too complex.
  // Wraith: Nothing relevant. Only option: If they were spotted or not?
  // Xaan: Nothing relevant. Only option: None?
];
