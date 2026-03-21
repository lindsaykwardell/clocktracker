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

export const DEMONS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  {
    id: "al_hadikhia_revives",
    category: "role",
    scope: "as_role",
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
  },
  {
    id: "al_hadikhia_all_die",
    category: "role",
    scope: "as_role",
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
        : `As the Al-Hadikhia, kill 3 players due to your ability when they all live.`,
  },
  {
    id: "al_hadikhia_self_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["al-hadikhia"],
    script: "experimental",
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
          ? `As the Al-Hadikhia, you've included yourself and ended up dying ${count} time${pluralize(count)}.`
          : `As the Al-Hadikhia, this player has included themselves and ended up dying ${count} time${pluralize(count)}.`)
        : `As the Al-Hadikhia, choose yourself and end up dying.`,
  },
  {
    id: "al_hadikhia_evil_revives",
    category: "role",
    scope: "as_role",
    roleIds: ["al-hadikhia"],
    script: "experimental",
    source: "grimoire_event",
    label: "Back In Service",
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
  },
  {
    id: "fang_gu_outsider_possessions",
    category: "role",
    scope: "as_role",
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
          ? `As the Fang Gu, you've possessed an Outsider ${count} time${pluralize(count)}.`
          : `As the Fang Gu, this player has possessed an Outsider ${count} time${pluralize(count)}.`)
        : `As the Fang Gu, jump to an Outsider by killing them.`,
  },
  {
    id: "fang_gu_possessions_received",
    category: "role",
    roleIds: ["fang_gu"],
    scope: "affected_player",
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Jumped in the Night",
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
          ? `You've been possessed by the Fang Gu ${count} time${pluralize(count)}.`
          : `This player has been possessed by the Fang Gu ${count} time${pluralize(count)}.`)
        : `As an Outsider, be possessed by the Fang Gu.`,
  },
  {
    id: "imp_starpasses",
    category: "role",
    scope: "as_role",
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
          ? `As the Imp, you've starpassed to a Minion ${count} time${pluralize(count)}.`
          : `As the Imp, this player has starpassed to a Minion ${count} time${pluralize(count)}.`)
        : `As the Imp, starpass to a Minion`,
  },
  {
    id: "imp_starpasses_received",
    category: "role",
    roleIds: ["imp"],
    scope: "affected_player",
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "Pass Received",
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
          ? `You've received the Starpass ${count} time${pluralize(count)}.`
          : `This player has received the Starpass ${count} time${pluralize(count)}.`)
        : `Receive a Starpass from the Imp.`,
  },
  {
    id: "kazali_minion_role_changes_caused",
    category: "role",
    scope: "as_role",
    roleIds: ["kazali"],
    script: "experimental",
    source: "grimoire_event",
    label: "Set Up To Win",
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
          ? `As the Kazali, you've turned ${count} player${pluralize(count)} into Minions.`
          : `As the Kazali, this player has turned ${count} player${pluralize(count)} into Minions.`)
        : `As the Kazali, turn a player into a Minion.`,
  },
  {
    id: "kazali_minion_role_changes_received",
    category: "role",
    roleIds: ["kazali"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Set Up By Evil",
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
          ? `You've been turned into a Minion by the Kazali ${count} time${pluralize(count)}.`
          : `This player has been turned into a Minion by the Kazali ${count} time${pluralize(count)}.`)
        : `Be turned into a Minion by the Kazali.`,
  },
  // Legion: Nothing to track really.
  // @todo: We need to check leviathan again, because there are 2 different endings and I don't think we can track that at the moment.
  {
    id: "leviathan_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["leviathan"],
    script: "experimental",
    source: "end_trigger",
    label: "Crushed by Time",
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
          ? `As the Leviathan, you've won by reaching the final day ${count} time${pluralize(count)}.`
          : `As the Leviathan, this player has won by reaching the final day ${count} time${pluralize(count)}.`)
        : `As the Leviathan, win by reaching the final day.`,
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
    id: "lleech_hosts_received",
    category: "role",
    roleIds: ["lleech"],
    scope: "affected_player",
    script: "experimental",
    source: "grimoire_event",
    label: "Chosen Host",
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
    id: "lord_of_typhon_alignment_changes_caused",
    category: "role",
    scope: "as_role",
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
        : `Be turned into a Minion by sitting next to the Lord of Typhon.`,
  },
  {
    id: "no_dashii_poisoned_received",
    category: "role",
    roleIds: ["no_dashii", "nodashii"],
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
          (event.by_role_id === "no_dashii" || event.by_role_id === "nodashii")
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been poisoned by the No Dashii ${count} time${pluralize(count)}.`
          : `This player has been poisoned by the No Dashii ${count} time${pluralize(count)}.`)
        : `Be poisoned by the No Dashii.`,
  },
  {
    id: "ojo_not_in_play_picks",
    category: "role",
    scope: "as_role",
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
        : `As the Ojo, choose a not-in-play character so the Storyteller decides.`,
  },
  {
    id: "po_triple_kills",
    category: "role",
    scope: "as_role",
    roleIds: ["po"],
    script: "bmr",
    source: "grimoire_event",
    label: "Triple Feast",
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
          ? `As the Po, you've unleashed a triple kill ${count} time${pluralize(count)}.`
          : `As the Po, this player has unleashed a triple kill ${count} time${pluralize(count)}.`)
        : `As the Po, unleash a triple kill.`,
  },
  // Pukka [sao: 2]: Nothing relevant. Only option: If they got a yes?
  // Riot: @todo
  {
    id: "shabaloth_revives",
    category: "role",
    scope: "as_role",
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
    scope: "as_role",
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
          ? `As the Vigormortis, you've killed your own minions ${count} time${pluralize(count)}.`
          : `As the Vigormortis, this player has killed their own minions ${count} time${pluralize(count)}.`)
        : `As the Vigormortis, kill one of your own minions`,
  },
  {
    id: "vigormortis_poisoned_received",
    category: "role",
    roleIds: ["vigormortis"],
    scope: "affected_player",
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Parting gift",
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
          ? `The Vigormortis poisoned you by killing a minion ${count} time${pluralize(count)}.`
          : `The Vigormortis poisoned this player by killing a minion ${count} time${pluralize(count)}.`)
        : `Have the Vigormortis poison you by killing one of their minions.`,
  },
  {
    id: "vortox_game_endings",
    category: "role",
    scope: "as_role",
    roleIds: ["vortox"],
    script: "snv",
    sao: 4,
    source: "end_trigger",
    label: "Lies Win",
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
          ? `As the Vortox, you've ended the game when no execution occurred ${count} time${pluralize(count)}.`
          : `As the Vortox, this player has ended the game after no execution occurred ${count} time${pluralize(count)}.`)
        : `As the Vortox, end the game due to your ability.`,
  },
  {
    id: "yaggababble_max_kills",
    category: "role",
    scope: "as_role",
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
  },
  {
    id: "zombuul_false_deaths",
    category: "role",
    scope: "as_role",
    roleIds: ["zombuul"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Buried Alive",
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
          ? `As the Zombuul, you've faked your death ${count} time${pluralize(count)} and stayed alive.`
          : `As the Zombuul, this player has faked their death ${count} time${pluralize(count)} and stayed alive.`)
        : `As the Zombuul, fake your death and stay alive.`,
  },
];
