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
          ? `As the Scapegoat, you've been executed due to your ability ${count} time${pluralize(count)}.`
          : `As the Scapegoat, this player has been executed due to their ability ${count} time${pluralize(count)}.`)
        : `As the Scapegoat, be executed due to your ability.`,
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
          ? `As the Gunslinger, you've killed ${count} player${pluralize(count)} with your ability.`
          : `As the Gunslinger, this player has killed ${count} player${pluralize(count)} with their ability.`)
        : `As the Gunslinger, kill a player with your ability.`,
  },
  {
    id: "beggar_alms_received",
    category: "role",
    scope: "as_role",
    roleIds: ["beggar"],
    script: "tb",
    source: "grimoire_event",
    label: "Charity",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter(
            (event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Alm"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Beggar, you've received ${count} alm${pluralize(count)}.`
          : `As the Beggar, this player has received ${count} alm${pluralize(count)}.`)
        : `As the Beggar, receive someone's vote token.`,
  },
  {
    id: "beggar_alms_given_received",
    category: "role",
    roleIds: ["beggar"],
    scope: "affected_player",
    script: "tb",
    source: "grimoire_event",
    label: "Token Donation",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "beggar" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Alm"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've given your vote token to the Beggar ${count} time${pluralize(count)}.`
          : `This player has given their vote token to the Beggar ${count} time${pluralize(count)}.`)
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
              event.status_source === "Butchered"
          ).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Butcher, you've executed ${count} extra player${pluralize(count)} due to your ability.`
          : `As the Butcher, this player has executed ${count} extra player${pluralize(count)} due to their ability.`)
        : `As the Butcher, execute an extra player due to your ability.`,
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
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Harlot, you've died alongside another player ${count} time${pluralize(count)} due to your ability.`
          : `As the Harlot, this player has died alongside another player ${count} time${pluralize(count)} due to their ability.`)
        : `As the Harlot, die alongside another player due to your ability.`,
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
          ? `As the Barista, you've made a player act twice ${count} time${pluralize(count)}.`
          : `As the Barista, this player has made a player act twice ${count} time${pluralize(count)}.`)
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
          ? `As the Barista, you've made a player sober and healthy ${count} time${pluralize(count)}.`
          : `As the Barista, this player has made a player sober and healthy ${count} time${pluralize(count)}.`)
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
          ? `As the Deviant, you've saved yourself from exile ${count} time${pluralize(count)} due to your ability.`
          : `As the Deviant, this player has saved themselves from exile ${count} time${pluralize(count)} due to their ability.`)
        : `As the Deviant, save yourself from exile due to your ability.`,
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
          ? `As the Matron, you've caused ${count} seat swap${pluralize(count)} with your ability.`
          : `As the Matron, this player has caused ${count} seat swaps${pluralize(count)} with their ability.`)
        : `As the Matron, swap two players' seating positions with your ability.`,
  },
  // Voudon: Nothing to track really.
  // Judge: @todo
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
          ? `As the Gangster, you've arranged ${count} hit${pluralize(count)} on your neighbors.`
          : `As the Gangster, this player has arranged ${count} hit${pluralize(count)} on their neighbors.`)
        : `As the Gangster, kill one of your neighbors with your ability.`,
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
          ? `As the Gnome, you've killed ${count} player${pluralize(count)} for nominating your amigo.`
          : `As the Gnome, this player has killed ${count} player${pluralize(count)} for nominating their amigo.`)
        : `As the Gnome, kill a player for nominating your amigo.`,
  },

];
