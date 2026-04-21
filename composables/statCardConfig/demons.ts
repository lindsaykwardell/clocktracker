import {
  GameEndTrigger,
  GameEndTriggerCause,
  GrimoireEventType,
  type GameRecord,
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
import type { RoleStatCardDefinition } from "./shared";

function countLeviathanGoodExecutions(game: GameRecord) {
  const executedGoodParticipants = new Set(
    game.grimoire_events
      .filter((event) => event.event_type === GrimoireEventType.EXECUTION)
      .filter((event) => {
        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);
        return (
          currentToken?.alignment === "GOOD" ||
          previousToken?.alignment === "GOOD"
        );
      })
      .map((event) => event.participant_id)
      .filter((participantId) => !!participantId)
  );

  return executedGoodParticipants.size;
}

export const DEMONS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "al_hadikhia_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Permanent Silence",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've killed ${count} player${pluralize(count)}.`
          : `As the Al-Hadikhia, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Al-Hadikhia, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by an Al-Hadikhia.`
        : `No Al-Hadikhia has killed a player yet.`,
  },
  {
    id: "al_hadikhia_revives",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Death Reversed",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've brought ${count} player${pluralize(count)} back from death after they chose to live.`
          : `As the Al-Hadikhia, this player has brought ${count} player${pluralize(count)} back from death after they chose to live.`)
        : `As the Al-Hadikhia, bring a player back from death by having them choose to live.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} brought back from death by an Al-Hadikhia.`
        : `No Al-Hadikhia has brought a player back from death yet.`,
  },
  {
    id: "al_hadikhia_all_die",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "All Die!",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let total = 0;

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
          if (count >= 3) {
            total += 1;
          }
        }
      }

      return total;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've killed all three chosen players ${count} time${pluralize(count)} when they all lived.`
          : `As the Al-Hadikhia, this player has killed all three chosen players ${count} time${pluralize(count)} when they all lived.`)
        : `As the Al-Hadikhia, kill all three chosen players when they all live.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} time${pluralize(count)}, all three chosen players were killed by an Al-Hadikhia.`
        : `No Al-Hadikhia has killed all three chosen players yet.`,
  },
  {
    id: "al_hadikhia_self_deaths",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["al-hadikhia"],
    script: "experimental",
    hidden: true,
    source: "grimoire_event",
    label: "Chose Poorly",
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
              currentToken?.role_id === roleId ||
              previousToken?.role_id === roleId
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've included yourself in your choices and ended up dying ${count} time${pluralize(count)}.`
          : `As the Al-Hadikhia, this player has included themselves in their choices and ended up dying ${count} time${pluralize(count)}.`)
        : `As the Al-Hadikhia, include yourself in your choices and end up dying.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Al-Hadikhia has included themselves in their choices and ended up dying at least ${count} time${pluralize(count)}.`
        : `No Al-Hadikhia has included themselves in their choices and ended up dying yet.`,
  },
  {
    id: "al_hadikhia_evil_revives",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Back in Service",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.REVIVE
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
          ? `As the Al-Hadikhia, you've brought ${count} evil player${pluralize(count)} back to life.`
          : `As the Al-Hadikhia, this player has brought ${count} evil player${pluralize(count)} back to life.`)
        : `As the Al-Hadikhia, bring an evil player back to life.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} evil player${pluralize(count)} ${wasWere(count)} brought back to life by an Al-Hadikhia.`
        : `No Al-Hadikhia has brought an evil player back to life yet.`,
  },
  {
    id: "fang_gu_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["fang_gu"],
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Fang Goodbye",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fang Gu, you've killed ${count} player${pluralize(count)}.`
          : `As the Fang Gu, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Fang Gu, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Fang Gu.`
        : `No Fang Gu has killed a player yet.`,
  },
  {
    id: "fang_gu_outsider_possessions",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["fang_gu"],
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Possession",
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

            const previousToken = getEventPreviousToken(game, event);
            const currentToken = getEventCurrentToken(game, event);

            return (
              previousToken?.role?.type === "OUTSIDER" &&
              currentToken?.role_id === roleId &&
              currentToken.alignment === "EVIL"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fang Gu, you've jumped to ${count} Outsider${pluralize(count)} when choosing them in the night.`
          : `As the Fang Gu, this player has jumped to ${count} Outsider${pluralize(count)} when choosing them in the night.`)
        : `As the Fang Gu, jump to an Outsider by choosing them in the night.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Outsider${pluralize(count)} ${wasWere(count)} changed into a Fang Gu.`
        : `No Fang Gu has changed an Outsider into a Fang Gu yet.`,
  },
  {
    id: "fang_gu_possessions_received",
    category: "role",
    roleIds: ["fang_gu"],
    scope: "affected_player",
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Jumped in the Night", // @todo Revisit title.
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "fang_gu"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role_id === "fang_gu" && currentToken.alignment === "EVIL";
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been chosen in the night by the Fang Gu ${count} time${pluralize(count)}.`
          : `This player has been chosen in the night by the Fang Gu ${count} time${pluralize(count)}.`)
        : `As an Outsider, be chosen in the night by the Fang Gu.`,
  },
  {
    id: "imp_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["imp"],
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "Pitchfork Harvest",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Imp, you've killed ${count} player${pluralize(count)}.`
          : `As the Imp, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Imp, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by an Imp.`
        : `No Imp has killed a player yet.`,
  },
  {
    id: "imp_starpasses",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["imp"],
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "The Starpass",
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

            const previousToken = getEventPreviousToken(game, event);
            const currentToken = getEventCurrentToken(game, event);

            return (
              previousToken?.role?.type === "MINION" &&
              currentToken?.role_id === roleId &&
              currentToken?.alignment === "EVIL" &&
              currentToken?.role?.type === "DEMON"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Imp, you've targeted yourself and passed the Demon role to a Minion ${count} time${pluralize(count)}.`
          : `As the Imp, this player has targeted themselves and passed the Demon role to a Minion ${count} time${pluralize(count)}.`)
        : `As the Imp, target yourself and pass the Demon role to a Minion.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Minion${pluralize(count)} became the Imp after an Imp targeted themselves.`
        : `No Imp has passed the Demon role to a Minion yet.`,
  },
  {
    id: "imp_starpasses_received",
    category: "role",
    roleIds: ["imp"],
    scope: "affected_player",
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "Your Problem Now",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "imp"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role_id === "imp";
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've become the Imp ${count} time${pluralize(count)} after they targeted themselves.`
          : `This player has become the Imp ${count} time${pluralize(count)} after the Imp targeted themselves.`)
        : `Become the Imp after they target themselves.`,
  },
  {
    id: "kazali_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["kazali"],
    script: "experimental",
    source: "grimoire_event",
    label: "Death by Design",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Kazali, you've killed ${count} player${pluralize(count)}.`
          : `As the Kazali, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Kazali, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Kazali.`
        : `No Kazali has killed a player yet.`,
  },
  {
    id: "kazali_minion_role_changes_caused",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["kazali"],
    script: "experimental",
    source: "grimoire_event",
    label: "Set Up to Win",
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
            return currentToken?.role?.type === "MINION";
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Kazali, you've changed ${count} player${pluralize(count)} into Minions.`
          : `As the Kazali, this player has changed ${count} player${pluralize(count)} into Minions.`)
        : `As the Kazali, change a player into a Minion.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} changed into Minions by a Kazali.`
        : `No Kazali has changed a player into a Minion yet.`,
  },
  {
    id: "kazali_minion_role_changes_received",
    category: "role",
    roleIds: ["kazali"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Why Me?",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.by_role_id !== "kazali" ||
            event.event_type !== GrimoireEventType.ROLE_CHANGE
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return currentToken?.role?.type === "MINION";
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into a Minion by the Kazali ${count} time${pluralize(count)}.`
          : `This player has been changed into a Minion by the Kazali ${count} time${pluralize(count)}.`)
        : `Be changed into a Minion by the Kazali.`,
  },
  // Legion: Nothing to track really.
  {
    id: "leviathan_second_good_execution",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["leviathan"],
    script: "experimental",
    source: "end_trigger",
    label: "Tide of Condemnation",
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
        if (subtype === "LEVIATHAN_SECOND_GOOD_EXECUTION") return true;
        if (subtype === "LEVIATHAN_DAY_FIVE") return false;

        return countLeviathanGoodExecutions(game) >= 2;
      }).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Leviathan, you've caused ${count} game${pluralize(count)} to end after a second good player was executed.`
          : `As the Leviathan, this player has caused ${count} game${pluralize(count)} to end after a second good player was executed.`)
        : `As the Leviathan, cause a game to end when a second good player is executed.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Leviathan after a second good player was executed.`
        : `No Leviathan has ended a game after a second good player was executed yet.`,
  },
  {
    id: "leviathan_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["leviathan"],
    script: "experimental",
    source: "end_trigger",
    label: "Crushed by Time",
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
        if (subtype === "LEVIATHAN_DAY_FIVE") return true;
        if (subtype === "LEVIATHAN_SECOND_GOOD_EXECUTION") return false;

        return countLeviathanGoodExecutions(game) < 2;
      }).length,
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Leviathan, you've caused ${count} game${pluralize(count)} to end when it reached the sixth day.`
          : `As the Leviathan, this player has caused ${count} game${pluralize(count)} to end when it reached the sixth day.`)
        : `As the Leviathan, cause a game to end when it reaches the sixth day.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Leviathan after five days passed.`
        : `No Leviathan has ended a game after five days passed yet.`,
  },
  {
    id: "lil_monsta_babysat_received",
    category: "role",
    roleIds: ["lil_monsta"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Babysitter Duty",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "lil_monsta" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Is The Demon"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've babysat Lil' Monsta ${count} time${pluralize(count)}.`
          : `This player has babysat Lil' Monsta ${count} time${pluralize(count)}.`)
        : `Babysit Lil' Monsta.`,
  },
  {
    id: "lleech_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["lleech"],
    script: "experimental",
    source: "grimoire_event",
    label: "A Taste for Pie",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Lleech, you've killed ${count} player${pluralize(count)}.`
          : `As the Lleech, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Lleech, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Lleech.`
        : `No Lleech has killed a player yet.`,
  },
  {
    id: "lleech_host_saves",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["lleech"],
    script: "experimental",
    source: "grimoire_event",
    label: "Unkillable Appetite",
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
              currentToken?.role_id === roleId || previousToken?.role_id === roleId
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Lleech, you've avoided ${count} death${pluralize(count)}.`
          : `As the Lleech, this player has avoided ${count} death${pluralize(count)}.`)
        : `As the Lleech, survive death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Lleech has avoided death at least ${count} time${pluralize(count)}.`
        : `No Lleech has avoided death yet.`,
  },
  {
    id: "lleech_hosts_received",
    category: "role",
    roleIds: ["lleech"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Spoiled Slice",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.POISONED &&
          event.by_role_id === "lleech"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've served as the Lleech's host ${count} time${pluralize(count)}.`
          : `This player has served as the Lleech's host ${count} time${pluralize(count)}.`)
        : `Serve as the Lleech's host.`,
  },
  {
    id: "lord_of_typhon_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["lord_of_typhon"],
    script: "experimental",
    source: "grimoire_event",
    label: "Mortal Unravelling",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Lord of Typhon, you've killed ${count} player${pluralize(count)}.`
          : `As the Lord of Typhon, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Lord of Typhon, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Lord of Typhon.`
        : `No Lord of Typhon has killed a player yet.`,
  },
  {
    id: "lord_of_typhon_alignment_changes_caused",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["lord_of_typhon"],
    script: "experimental",
    source: "grimoire_event",
    label: "Cosmic Formation",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Lord of Typhon, you've changed ${count} player${pluralize(count)} by starting next to them.`
          : `As the Lord of Typhon, this player has changed ${count} player${pluralize(count)} by starting next to them.`)
        : `As the Lord of Typhon, change a player by starting next to them.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} changed by a Lord of Typhon starting next to them.`
        : `No Lord of Typhon has changed a player by starting next to them yet.`,
  },
  {
    id: "lord_of_typhon_alignment_changes_received",
    category: "role",
    roleIds: ["lord_of_typhon"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Wrong Place and Time",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "lord_of_typhon"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into a minion by sitting next to the Lord of Typhon ${count} time${pluralize(count)}.`
          : `This player has been changed into a minion by sitting next to the Lord of Typhon ${count} time${pluralize(count)}.`)
        : `Be changed into a Minion by sitting next to the Lord of Typhon.`,
  },
  {
    id: "no_dashii_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["no_dashii"],
    script: "snv",
    sao: 3,
    source: "grimoire_event",
    label: "Dragged Below",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the No Dashii, you've killed ${count} player${pluralize(count)}.`
          : `As the No Dashii, this player has killed ${count} player${pluralize(count)}.`)
        : `As the No Dashii, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a No Dashii.`
        : `No player has been killed by a No Dashii yet.`,
  },
  {
    id: "no_dashii_poisoned_received",
    category: "role",
    roleIds: ["no_dashii"],
    scope: "affected_player",
    script: "snv",
    sao: 3,
    source: "grimoire_event",
    label: "Poisoned Perimeter",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.POISONED &&
          event.by_role_id === "no_dashii"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been poisoned by the No Dashii ${count} time${pluralize(count)}.`
          : `This player has been poisoned by the No Dashii ${count} time${pluralize(count)}.`)
        : `Be poisoned by the No Dashii.`,
  },
  {
    id: "ojo_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["ojo"],
    script: "experimental",
    source: "grimoire_event",
    label: "I See You",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Ojo, you've killed ${count} player${pluralize(count)}.`
          : `As the Ojo, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Ojo, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by an Ojo.`
        : `No Ojo has killed a player yet.`,
  },
  {
    id: "ojo_not_in_play_picks",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["ojo"],
    script: "experimental",
    source: "grimoire_event",
    label: "Missed the Mark",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Not in play"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Ojo, you've chosen a not-in-play character ${count} time${pluralize(count)}, leaving the kill to the Storyteller.`
          : `As the Ojo, this player has chosen a not-in-play character ${count} time${pluralize(count)}, leaving the kill to the Storyteller.`)
        : `As the Ojo, choose a not-in-play character, leaving the kill to the Storyteller.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Ojo has chosen a not-in-play character at least ${count} time${pluralize(count)}.`
        : `No Ojo has chosen a not-in-play character yet.`,
  },
  {
    id: "po_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["po"],
    script: "bmr",
    source: "grimoire_event",
    label: "Flowers for the Dead",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Po, you've killed ${count} player${pluralize(count)}.`
          : `As the Po, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Po, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Po.`
        : `No Po has killed a player yet.`,
  },
  {
    id: "po_triple_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["po"],
    script: "bmr",
    source: "grimoire_event",
    label: "Funeral Bouquet",
    getCount: ({ games, roleId }) => {
      if (!roleId) return 0;

      let total = 0;

      for (const game of games) {
        if (game.ignore_for_stats) continue;

        const countsByPage = new Map<number, number>();

        for (const event of game.grimoire_events) {
          if (
            event.by_role_id !== roleId ||
            event.event_type !== GrimoireEventType.DEATH ||
            event.grimoire_page === 0
          ) {
            continue;
          }

          countsByPage.set(
            event.grimoire_page,
            (countsByPage.get(event.grimoire_page) ?? 0) + 1
          );
        }

        for (const count of countsByPage.values()) {
          if (count >= 3) {
            total += 1;
          }
        }
      }

      return total;
    },
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Po, you've successfully killed three players in a single night ${count} time${pluralize(count)}.`
          : `As the Po, this player has successfully killed three players in a single night ${count} time${pluralize(count)}.`)
        : `As the Po, successfully kill three players in a single night.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} night${pluralize(count)} had three players killed by a Po.`
        : `No Po has killed three players in a single night yet.`,
  },
  {
    id: "pukka_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["pukka"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Only a Scratch",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Pukka, you've killed ${count} player${pluralize(count)}.`
          : `As the Pukka, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Pukka, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Pukka.`
        : `No Pukka has killed a player yet.`,
  },
  {
    id: "riot_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["riot"],
    script: "experimental",
    source: "grimoire_event",
    label: "Viva la Muerte",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As Riot, you've had ${count} player${pluralize(count)} killed due to Riot.`
          : `As Riot, this player has had ${count} player${pluralize(count)} killed due to Riot.`)
        : `As Riot, have a player killed due to Riot.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by Riot.`
        : `No Riot has killed a player yet.`,
  },
  {
    id: "riot_minion_role_changes_caused",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["riot"],
    script: "experimental",
    source: "grimoire_event",
    label: "Revolution Spreads",
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
              previousToken?.role?.type === "MINION" &&
              currentToken?.role_id === roleId
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As Riot, you've changed ${count} Minion${pluralize(count)} into another Riot.`
          : `As Riot, this player has changed ${count} Minion${pluralize(count)} into another Riot.`)
        : `As Riot, change a Minion into another Riot.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Minion${pluralize(count)} ${wasWere(count)} changed into Riot.`
        : `No Riot has changed a Minion into Riot yet.`,
  },
  {
    id: "riot_minion_role_changes_received",
    category: "role",
    roleIds: ["riot"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Joined the Revolution",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        if (
          event.by_role_id !== "riot" ||
          event.event_type !== GrimoireEventType.ROLE_CHANGE
        ) {
          return false;
        }

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);

        return (
          previousToken?.role?.type === "MINION" &&
          currentToken?.role_id === "riot"
        );
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into Riot ${count} time${pluralize(count)}.`
          : `This player has been changed into Riot ${count} time${pluralize(count)}.`)
        : `Be changed into Riot.`,
  },
  {
    id: "shabaloth_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["shabaloth"],
    script: "bmr",
    sao: 3,
    source: "grimoire_event",
    label: "Swallowed by the Maw",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Shabaloth, you've killed ${count} player${pluralize(count)}.`
          : `As the Shabaloth, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Shabaloth, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Shabaloth.`
        : `No Shabaloth has killed a player yet.`,
  },
  {
    id: "shabaloth_revives",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["shabaloth"],
    script: "bmr",
    sao: 3,
    source: "grimoire_event",
    label: "Returned from the Maw",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Shabaloth, you've brought ${count} player${pluralize(count)} back to life.`
          : `As the Shabaloth, this player has brought ${count} player${pluralize(count)} back to life.`)
        : `As the Shabaloth, bring a player back to life.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} brought back to life by a Shabaloth.`
        : `No Shabaloth has brought a player back to life yet.`,
  },
  {
    id: "vigormortis_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["vigormortis"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Everlasting Death",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vigormortis, you've killed ${count} player${pluralize(count)}.`
          : `As the Vigormortis, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Vigormortis, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Vigormortis.`
        : `No Vigormortis has killed a player yet.`,
  },
  {
    id: "vigormortis_minion_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["vigormortis"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Disposable Assets",
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
              currentToken?.role?.type === "MINION" ||
              previousToken?.role?.type === "MINION"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vigormortis, you've killed ${count} of your own minions.`
          : `As the Vigormortis, this player has killed ${count} of their own minions.`)
        : `As the Vigormortis, kill one of your own minions.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Minion${pluralize(count)} ${wasWere(count)} killed by a Vigormortis.`
        : `No Vigormortis has killed a Minion yet.`,
  },
  {
    id: "vigormortis_poisoned_received",
    category: "role",
    roleIds: ["vigormortis"],
    scope: "affected_player",
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Parting Gift",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.POISONED &&
          event.by_role_id === "vigormortis"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been poisoned by the Vigormortis killing a minion ${count} time${pluralize(count)}.`
          : `This player has been poisoned by the Vigormortis killing a minion ${count} time${pluralize(count)}.`)
        : `Have the Vigormortis poison you when they kill one of their minions.`,
  },
  {
    id: "vortox_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["vortox"],
    script: "snv",
    sao: 4,
    source: "grimoire_event",
    label: "Death Spiral",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vortox, you've killed ${count} player${pluralize(count)}.`
          : `As the Vortox, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Vortox, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Vortox.`
        : `No Vortox has killed a player yet.`,
  },
  {
    id: "vortox_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["vortox"],
    script: "snv",
    sao: 4,
    source: "end_trigger",
    label: "Disinformation Reigns",
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
          ? `As the Vortox, you've caused ${count} game${pluralize(count)} to end when no execution occurred.`
          : `As the Vortox, this player has caused ${count} game${pluralize(count)} to end when no execution occurred.`)
        : `As the Vortox, cause a game to end when no execution occurs.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Vortox when no execution occurred.`
        : `No Vortox has ended a game when no execution occurred yet.`,
  },
  {
    id: "yaggababble_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["yaggababble"],
    script: "experimental",
    source: "grimoire_event",
    label: "Sticks and Stones",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Yaggababble, you've killed ${count} player${pluralize(count)}.`
          : `As the Yaggababble, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Yaggababble, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Yaggababble.`
        : `No Yaggababble has killed a player yet.`,
  },
  {
    id: "yaggababble_max_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["yaggababble"],
    script: "experimental",
    source: "grimoire_event",
    label: "Catch Phrase",
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
          ? `As the Yaggababble, your highest number of kills at once is ${count}.`
          : `As the Yaggababble, this player's highest number of kills at once is ${count}.`)
        : `As the Yaggababble, kill multiple players at once.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `The highest number of players killed at once by a Yaggababble is ${count}.`
        : `No Yaggababble has killed multiple players at once yet.`,
  },
  {
    id: "zombuul_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["zombuul"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Sleeping in the Dirt",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Zombuul, you've killed ${count} player${pluralize(count)}.`
          : `As the Zombuul, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Zombuul, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Zombuul.`
        : `No Zombuul has killed a player yet.`,
  },
  {
    id: "zombuul_false_deaths",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["zombuul"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "From Beyond the Grave",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(games, (game, event) => {
            if (
              event.by_role_id !== roleId ||
              event.event_type !== GrimoireEventType.OTHER ||
              event.status_source !== "Registers as dead"
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
          ? `As the Zombuul, you've feigned death ${count} time${pluralize(count)}.`
          : `As the Zombuul, this player has feigned death ${count} time${pluralize(count)}.`)
        : `As the Zombuul, feign your death.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Zombuul has feigned death at least ${count} time${pluralize(count)}.`
        : `No Zombuul has feigned death yet.`,
  },
];
