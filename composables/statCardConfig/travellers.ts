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
} from "./shared";
import type { RoleStatCardDefinition } from "./shared";

export const TRAVELLERS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "scapegoat_ability_executions",
    category: "role",
    scope: "as_role",
    roleIds: ["scapegoat"],
    script: "tb",
    source: "grimoire_event",
    label: "Taking the Fall",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.event_type !== GrimoireEventType.EXECUTION ||
              event.by_role_id !== roleId
            ) {
              return false;
            }

            const currentToken = getEventCurrentToken(game, event);
            const previousToken = getEventPreviousToken(game, event);

            return (
              currentToken?.role_id === roleId ||
              previousToken?.role_id === roleId ||
              event.role_id === roleId
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Scapegoat, you've been executed in someone else's place ${count} time${pluralize(count)}.`
          : `As the Scapegoat, this player has been executed in someone else's place ${count} time${pluralize(count)}.`)
        : `As the Scapegoat, be executed in someone else's place.`,
  },
  {
    id: "gunslinger_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["gunslinger"],
    script: "tb",
    source: "grimoire_event",
    label: "Deadeye",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gunslinger, you've killed ${count} player${pluralize(count)}.`
          : `As the Gunslinger, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Gunslinger, kill a player.`,
  },
  {
    id: "gunslinger_demon_kill_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gunslinger"],
    script: "tb",
    source: "end_trigger",
    label: "Silver Bullet",
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
          ? `As the Gunslinger, you've ended ${count} game${pluralize(count)} by killing the Demon.`
          : `As the Gunslinger, this player has ended ${count} game${pluralize(count)} by killing the Demon.`)
        : `As the Gunslinger, end a game by killing the Demon.`,
  },
  {
    id: "gunslinger_final3_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gunslinger"],
    script: "tb",
    source: "end_trigger",
    label: "Ain't No Mexican Standoff",
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
          ? `As the Gunslinger, you've ended ${count} game${pluralize(count)} by killing a player, leaving only two players alive.`
          : `As the Gunslinger, this player has ended ${count} game${pluralize(count)} by killing a player, leaving only two players alive.`)
        : `As the Gunslinger, end a game by killing a player, leaving only two players alive.`,
  },
  {
    id: "beggar_votes_received",
    category: "role",
    scope: "as_role",
    roleIds: ["beggar"],
    script: "tb",
    source: "grimoire_event",
    label: "Open Palm",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Vote Given"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Beggar, you've received ${count} vote token${pluralize(count)}.`
          : `As the Beggar, this player has received ${count} vote token${pluralize(count)}.`)
        : `As the Beggar, receive someone's vote token.`,
  },
  {
    id: "beggar_votes_given_received",
    category: "role",
    roleIds: ["beggar"],
    scope: "affected_player",
    script: "tb",
    source: "grimoire_event",
    label: "Charity Given",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "beggar" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Vote Given"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've given ${count} vote token${pluralize(count)} to the Beggar.`
          : `This player has given ${count} token${pluralize(count)} to the Beggar.`)
        : `Give your vote token to the Beggar.`,
  },
  {
    id: "bureaucrat_extra_votes_given",
    category: "role",
    scope: "as_role",
    roleIds: ["bureaucrat"],
    script: "tb",
    source: "grimoire_event",
    label: "Stacked the Ballot",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "3 Votes"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Bureaucrat, you've given ${count} player${pluralize(count)} extra votes.`
          : `As the Bureaucrat, this player has given ${count} player${pluralize(count)} extra votes.`)
        : `As the Bureaucrat, give a player extra votes.`,
  },
  {
    id: "bureaucrat_extra_votes_received",
    category: "role",
    roleIds: ["bureaucrat"],
    scope: "affected_player",
    script: "tb",
    source: "grimoire_event",
    label: "Backed by Bureaucracy",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "bureaucrat" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "3 Votes"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've received extra votes from the Bureaucrat ${count} time${pluralize(count)}.`
          : `This player has received extra votes from the Bureaucrat ${count} time${pluralize(count)}.`)
        : `Receive extra votes from the Bureaucrat.`,
  },
  {
    id: "thief_votes_stolen",
    category: "role",
    scope: "as_role",
    roleIds: ["thief"],
    script: "tb",
    source: "grimoire_event",
    label: "Sticky Fingers",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Negative Vote"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Thief, you've stolen ${count} vote${pluralize(count)}.`
          : `As the Thief, this player has stolen ${count} vote${pluralize(count)}.`)
        : `As the Thief, steal a vote.`,
  },
  {
    id: "thief_votes_stolen_received",
    category: "role",
    roleIds: ["thief"],
    scope: "affected_player",
    script: "tb",
    source: "grimoire_event",
    label: "Pickpocketed",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "thief" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Negative Vote"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've had ${count} vote${pluralize(count)} stolen by the Thief.`
          : `This player has had ${count} vote${pluralize(count)} stolen by the Thief.`)
        : `Have a vote stolen by the Thief.`,
  },

  {
    id: "butcher_additional_executions",
    category: "role",
    scope: "as_role",
    roleIds: ["butcher"],
    script: "snv",
    source: "grimoire_event",
    label: "Meat Grinder",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.EXECUTION &&
              event.status_source === "Executed"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Butcher, you've executed ${count} additional player${pluralize(count)}.`
          : `As the Butcher, this player has executed ${count} additional player${pluralize(count)}.`)
        : `As the Butcher, execute an additional player.`,
  },
  {
    id: "butcher_demon_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["butcher"],
    script: "snv",
    source: "end_trigger",
    label: "Prime Cut",
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
          ? `As the Butcher, you've ended ${count} game${pluralize(count)} by executing the Demon.`
          : `As the Butcher, this player has ended ${count} game${pluralize(count)} by executing the Demon.`)
        : `As the Butcher, end a game by executing the Demon.`,
  },
  {
    id: "butcher_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["butcher"],
    script: "snv",
    source: "end_trigger",
    label: "Cut to the Bone",
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
          ? `As the Butcher, you've ended ${count} game${pluralize(count)} by executing an additional player, leaving only two players alive.`
          : `As the Butcher, this player has ended ${count} game${pluralize(count)} by executing an additional player, leaving only two players alive.`)
        : `As the Butcher, end a game by executing an additional player, leaving only two players alive.`,
  },
  {
    id: "bone_collector_restored_abilities",
    category: "role",
    scope: "as_role",
    roleIds: ["bone_collector"],
    script: "snv",
    source: "grimoire_event",
    label: "Unearthed Potential",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Has Ability"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Bone Collector, you've made ${count} player${pluralize(count)} regain their ability.`
          : `As the Bone Collector, this player has made ${count} player${pluralize(count)} regain their ability.`)
        : `As the Bone Collector, make a dead player regain their ability.`,
  },
  {
    id: "harlot_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["harlot"],
    script:"snv",
    source: "grimoire_event",
    label: "Dangerous Liaison",
    getCount: ({ games, roleId }) =>
      Math.floor(countGrimoireEvents(games, roleId, GrimoireEventType.DEATH) / 2),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harlot, you've died alongside ${count} other player${pluralize(count)}.`
          : `As the Harlot, this player has died alongside ${count} other player${pluralize(count)}.`)
        : `As the Harlot, die alongside another player.`,
  },
  {
    id: "barista_acts_twice_given",
    category: "role",
    scope: "as_role",
    roleIds: ["barista"],
    script: "snv",
    source: "grimoire_event",
    label: "Double Shot",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Acts Twice"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Barista, you've made ${count} player${pluralize(count)} act twice.`
          : `As the Barista, this player has made ${count} player${pluralize(count)} act twice.`)
        : `As the Barista, make a player act twice.`,
  },
  {
    id: "barista_sober_healthy_given",
    category: "role",
    scope: "as_role",
    roleIds: ["barista"],
    script: "snv",
    source: "grimoire_event",
    label: "Straight Espresso",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Sober and Healthy"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Barista, you've made ${count} player${pluralize(count)} sober and healthy.`
          : `As the Barista, this player has made ${count} player${pluralize(count)} sober and healthy.`)
        : `As the Barista, make a player sober and healthy.`,
  },
  {
    id: "deviant_exiles_avoided",
    category: "role",
    scope: "as_role",
    roleIds: ["deviant"],
    script: "snv",
    source: "grimoire_event",
    label: "Last Laugh",
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
          ? `As the Deviant, you've saved yourself from exile ${count} time${pluralize(count)}.`
          : `As the Deviant, this player has saved themselves from exile ${count} time${pluralize(count)}.`)
        : `As the Deviant, save yourself from exile.`,
  },

  // Apprentice: Too complex
  {
    id: "matron_seat_changes_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["matron"],
    script: "bmr",
    source: "grimoire_event",
    label: "Table Manners",
    getCount: ({ games, roleId }) => {
      const seatChanges = countGrimoireEvents(
        games,
        roleId,
        GrimoireEventType.SEAT_CHANGE
      );

      // Matron swaps are recorded per moved player, so convert to swap actions.
      return Math.floor(seatChanges / 2);
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Matron, you've caused ${count} seat swap${pluralize(count)}.`
          : `As the Matron, this player has caused ${count} seat swap${pluralize(count)}.`)
        : `As the Matron, swap two players' seating positions.`,
  },
  // Voudon: Nothing to track really.
  {
    id: "judge_executions_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["judge"],
    script: "bmr",
    source: "grimoire_event",
    label: "Death Sentence",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.EXECUTION
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Judge, you've forced the execution of ${count} player${pluralize(count)}.`
          : `As the Judge, this player has forced the execution of ${count} player${pluralize(count)}.`)
        : `As the Judge, force the execution of a player.`,
  },
  {
    id: "judge_failed_executions_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["judge"],
    script: "bmr",
    source: "grimoire_event",
    label: "Stayed Sentence",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Execution Failed"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Judge, you've caused ${count} execution${pluralize(count)} to fail.`
          : `As the Judge, this player has caused ${count} execution${pluralize(count)} to fail.`)
        : `As the Judge, cause an execution to fail.`,
  },
  {
    id: "judge_demon_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["judge"],
    script: "bmr",
    source: "end_trigger",
    label: "Final Verdict",
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
          ? `As the Judge, you've ended ${count} game${pluralize(count)} by forcing the execution of the Demon.`
          : `As the Judge, this player has ended ${count} game${pluralize(count)} by forcing the execution of the Demon.`)
        : `As the Judge, end a game by forcing the execution of the Demon.`,
  },
  {
    id: "judge_execution_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["judge"],
    script: "bmr",
    source: "end_trigger",
    label: "Judgment Day",
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
          ? `As the Judge, you've ended ${count} game${pluralize(count)} by forcing the execution of a player, leaving only two players alive.`
          : `As the Judge, this player has ended ${count} game${pluralize(count)} by forcing the execution of a player, leaving only two players alive.`)
        : `As the Judge, end a game by forcing the execution of a player, leaving only two players alive.`,
  },
  // Bishop: @todo
  {
    id: "cacklejack_role_changes_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["cacklejack"],
    script: "experimental",
    source: "grimoire_event",
    label: "BoiNgo-banGo!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Cacklejack, you've caused ${count} player${pluralize(count)} to change into a different character.`
          : `As the Cacklejack, this player has caused ${count} player${pluralize(count)} to change into a different character.`)
        : `As the Cacklejack, cause a player to be changed into a different character.`,
  },
  {
    id: "cacklejack_role_changes_received",
    category: "role",
    roleIds: ["cacklejack"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "GAzOinks!",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "cacklejack"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into a different character due to the Cacklejack ${count} time${pluralize(count)}.`
          : `This player has been changed into a different character due to the Cacklejack ${count} time${pluralize(count)}.`)
        : `Be changed into a different character due to the Cacklejack.`,
  },
  {
    id: "gangster_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["gangster"],
    script: "experimental",
    source: "grimoire_event",
    label: "Contract Killing",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gangster, you've killed ${count} neighbor${pluralize(count)}.`
          : `As the Gangster, this player has killed ${count} neighbor${pluralize(count)}.`)
        : `As the Gangster, kill one of your neighbors.`,
  },
  {
    id: "gangster_demon_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gangster"],
    script: "experimental",
    hidden: true,
    source: "end_trigger",
    label: "Contract Gone Wrong",
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
          ? `As the Gangster, you've ended ${count} game${pluralize(count)} by killing the Demon.`
          : `As the Gangster, this player has ended ${count} game${pluralize(count)} by killing the Demon.`)
        : `As the Gangster, end a game by killing the Demon.`,
  },
  {
    id: "gangster_death_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gangster"],
    script: "experimental",
    source: "end_trigger",
    label: "Last Contract",
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
          ? `As the Gangster, you've ended ${count} game${pluralize(count)} by killing one of your neighbors, leaving only two players alive.`
          : `As the Gangster, this player has ended ${count} game${pluralize(count)} by killing one of their neighbors, leaving only two players alive.`)
        : `As the Gangster, end a game by killing one of your neighbors, leaving only two players alive.`,
  },
  {
    id: "gnome_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["gnome"],
    script: "experimental",
    source: "grimoire_event",
    label: "Hands Off My Amigo",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Gnome, you've killed ${count} player${pluralize(count)}.`
          : `As the Gnome, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Gnome, kill a player.`,
  },
  {
    id: "gnome_demon_kill_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gnome"],
    script: "experimental",
    source: "end_trigger",
    label: "Fiery Revenge",
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
          ? `As the Gnome, you've ended ${count} game${pluralize(count)} by killing the Demon for nominating your amigo.`
          : `As the Gnome, this player has ended ${count} game${pluralize(count)} by killing the Demon for nominating your amigo.`)
        : `As the Gnome, end a game by killing the Demon for nominating your amigo.`,
  },
  {
    id: "gnome_death_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["gnome"],
    script: "experimental",
    source: "end_trigger",
    label: "Final Warning",
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
          ? `As the Gnome, you've ended ${count} game${pluralize(count)} by killing a player for nominating your amigo, leaving only two players alive.`
          : `As the Gnome, this player has ended ${count} game${pluralize(count)} by killing a player for nominating their amigo, leaving only two players alive.`)
        : `As the Gnome, end a game by killing a player for nominating your amigo, leaving only two players alive.`,
  },
  {
    id: "gnome_amigo_marked",
    category: "role",
    roleIds: ["gnome"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Untouchable Amigo",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "gnome" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Amigo"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been the Gnome's amigo ${count} time${pluralize(count)}.`
          : `This player has been the Gnome's amigo ${count} time${pluralize(count)}.`)
        : `Be the Gnome's amigo.`,
  },

];
