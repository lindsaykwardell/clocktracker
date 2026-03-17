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

export const DEMONS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "al_hadikhia_revives",
    category: "role",
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
        : `As the Al-Hadikhia, bring a player back from death by having them chose to live.`,
  },
  {
    id: "al_hadikhia_all_die",
    category: "role",
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
          ? `As the Al-Hadikhia, you've killed all 3 chosen players ${count} time${pluralize(count)} when they all lived.`
          : `As the Al-Hadikhia, this player has killed all 3 chosen players ${count} time${pluralize(count)} when they all lived.`)
        : `As the Al-Hadikhia, kill 3 players due to your ability zhen they all live.`,
  },
  {
    id: "al_hadikhia_self_deaths",
    category: "role",
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Chose Poorly",
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
              currentToken?.role_id === roleId ||
              previousToken?.role_id === roleId
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've included yourself and ended up dying ${count} time${pluralize(count)}.`
          : `As the Al-Hadikhia, this player has included themselves and ended up dying ${count} time${pluralize(count)}.`)
        : `As the Al-Hadikhia, choose yourself and end up dying.`,
  },
  {
    id: "al_hadikhia_evil_revives",
    category: "role",
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Back In Service",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        return (
          total +
          game.grimoire_events.filter((event) => {
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
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Al-Hadikhia, you've brought ${count} evil player${pluralize(count)} back to life.`
          : `As the Al-Hadikhia, this player has brought ${count} evil player${pluralize(count)} back to life.`)
        : `As the Al-Hadikhia, bring an evil player back to life.`,
  },
  {
    id: "fang_gu_outsider_possessions",
    category: "role",
    roleIds: ["fang_gu"],
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Possession",
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
              previousToken?.role?.type === "OUTSIDER" &&
              currentToken?.role_id === roleId &&
              currentToken.alignment === "EVIL"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Fang Gu, you've possessed an Outsider ${count} time${pluralize(count)}.`
          : `As the Fang Gu, this player has possessed an Outsider ${count} time${pluralize(count)}.`)
        : `As the Fang Gu, jump to an Outsider by killing them.`,
  },
  {
    id: "fang_gu_possessions_received",
    category: "role",
    roleIds: ["fang_gu"],
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Jumped in the Night",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.ROLE_CHANGE ||
            event.by_role_id !== "fang_gu"
          ) {
            return false;
          }

          const currentToken = getEventCurrentToken(game, event);
          return (
            currentToken?.role_id === "fang_gu" &&
            currentToken.alignment === "EVIL"
          );
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been possessed by the Fang Gu ${count} time${pluralize(count)}.`
          : `This player has been possessed by the Fang Gu ${count} time${pluralize(count)}.`)
        : `As an Outsider, be possessed by the Fang Gu.`,
  },
  {
    id: "imp_starpasses",
    category: "role",
    roleIds: ["imp"],
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "The Starpass",
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
              previousToken?.role_id === roleId &&
              currentToken?.alignment === "EVIL" &&
              currentToken?.role?.type === "MINION"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Imp, you've starpassed to a Minion ${count} time${pluralize(count)}.`
          : `As the Imp, this player has starpassed to a Minion ${count} time${pluralize(count)}.`)
        : `As the Imp, starpass to a Minion`,
  },
  {
    id: "imp_starpasses_received",
    category: "role",
    roleIds: ["imp"],
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "Pass Received",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
          ? `You've received the Starpass ${count} time${pluralize(count)}.`
          : `This player has received the Starpass ${count} time${pluralize(count)}.`)
        : `Receive a Starpass from the Imp.`,
  },
  {
    id: "kazali_minion_role_changes_caused",
    category: "role",
    roleIds: ["kazali"],
    script: "experimental",
    source: "grimoire_event",
    label: "Set Up To Win",
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

            const currentToken = getEventCurrentToken(game, event);
            return currentToken?.role?.type === "MINION";
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Kazali, you've turned ${count} player${pluralize(count)} into Minions.`
          : `As the Kazali, this player has turned ${count} player${pluralize(count)} into Minions.`)
        : `As the Kazali, turn a player into Minion.`,
  },
  {
    id: "kazali_minion_role_changes_received",
    category: "role",
    roleIds: ["kazali"],
    script: "experimental",
    source: "grimoire_event",
    label: "Set Up By Evil",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
          ? `You've been turned into a Minion by the Kazali ${count} time${pluralize(count)}.`
          : `This player has been turned into a Minion by the Kazali ${count} time${pluralize(count)}.`)
        : `Be turned into a Minion by the Kazali.`,
  },
  // Legion: Nothing to track really.
  // Leviathan: @todo
  {
    id: "lil_monsta_babysat_received",
    category: "role",
    roleIds: ["lil_monsta"],
    script: "experimental",
    source: "grimoire_event",
    label: "Babysitter Duty",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
    id: "lleech_hosts_received",
    category: "role",
    roleIds: ["lleech"],
    script: "experimental",
    source: "grimoire_event",
    label: "Chosen Host",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
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
    id: "lord_of_typhon_alignment_changes_caused",
    category: "role",
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
  },
  {
    id: "lord_of_typhon_alignment_changes_received",
    category: "role",
    roleIds: ["lord_of_typhon"],
    script: "experimental",
    source: "grimoire_event",
    label: "Wrong Place and Time",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.ROLE_CHANGE &&
          event.by_role_id === "lord_of_typhon"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been changed into a minion by sitting next to the Lord of Typhon ${count} time${pluralize(count)}.`
          : `This player has been changed into a minion by sitting next to the Lord of Typhon ${count} time${pluralize(count)}.`)
        : `Be turned into a minion by sitting next to the Lord of Typhon.`,
  },
  // No Dashii sao: 3,: @todo
  // Ojo: No reminder token(s), would be cool if we could track how many times they chose (in)correctly.
  // Po: @todo
  // Pukka: sao: 2, Nothing to track really? @todo unless we track poisoned by?
  // Riot: @todo
  {
    id: "shabaloth_revives",
    category: "role",
    roleIds: ["shabaloth"],
    script: "bmr",
    sao: 3,
    source: "grimoire_event",
    label: "Returned From The Maw",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.REVIVE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Shabaloth, you've regurgitated ${count} player${pluralize(count)} back to life.`
          : `As the Shabaloth, this player has regurgitated ${count} player${pluralize(count)} back to life.`)
        : `Regurgitate a player back to life.`,
  },
  {
    id: "vigormortis_minion_kills",
    category: "role",
    roleIds: ["vigormortis"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Disposable Assets",
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
              currentToken?.role?.type === "MINION" ||
              previousToken?.role?.type === "MINION"
            );
          }).length
        );
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Vigormortis, you've killed your own minions ${count} time${pluralize(count)}.`
          : `As the Vigormortis, this player has killed their own minions ${count} time${pluralize(count)}.`)
        : `As the Vigormortis, kill one of your own minions`,
  },
  {
    id: "vigormortis_poisoned_received",
    category: "role",
    roleIds: ["vigormortis"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Parting gift",
    getCount: ({ games, username }) =>
      countEventsAffectingPlayer(
        games,
        username,
        (_, event) =>
          event.event_type === GrimoireEventType.POISONED &&
          event.by_role_id === "vigormortis"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `The Vigormortis poisoned you by killing a minion ${count} time${pluralize(count)}.`
          : `The Vigormortis poisoned this player by killing a minion ${count} time${pluralize(count)}.`)
        : `Have The Vigormortis poison you by killing one of their minions.`,
  },
  // Vortox sao: 4,: @todo
  // Yaggababble: @todo
  // Zombuul sao: 1,: Would be cool if we could track how many times they died.
];
