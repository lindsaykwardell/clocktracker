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

export const OUTSIDERS_ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  // Outsiders
  // ------------------------ 
  {
    // @todo: these are pairs so halve this number?
    id: "barber_role_swaps",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["barber"],
    script: "snv",
    sao: 3,
    source: "grimoire_event",
    label: "Shear Chaos",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Barber, you've caused ${count} player${pluralize(count)} to swap characters when you died.`
          : `As the Barber, this player has caused ${count} player${pluralize(count)} to swap characters when they died.`)
        : `As the Barber, cause players to swap characters when you die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} swapped by a Barber dying.`
        : `No Barber has caused players to swap characters yet.`,
  },
  {
    id: "butler_master_received",
    category: "role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["butler"],
    scope: "affected_player",
    script: "tb",
    sao: 1,
    source: "grimoire_event",
    label: "At Your Service",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.by_role_id === "butler" &&
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Master"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been chosen as the Butler's master ${count} time${pluralize(count)}.`
          : `This player has been chosen as the Butler's master ${count} time${pluralize(count)}.`)
        : `Be chosen as the Butler's master.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Butler has chosen a master at least ${count} time${pluralize(count)}.`
        : `No Butler has chosen a master yet.`,
  },
  {
    id: "damsel_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["damsel"],
    script: "experimental",
    source: "end_trigger",
    label: "Happily Never After",
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
          ? `As the Damsel, you've caused ${count} game${pluralize(count)} to end.`
          : `As the Damsel, this player has caused ${count} game${pluralize(count)} to end.`)
        : `As the Damsel, cause a game to end.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Damsel being guessed.`
        : `No Damsel has ended a game by being guessed yet.`,
  },
  // Drunk [sao: 4]: Too complex.
  {
    id: "golem_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["golem"],
    script: "experimental",
    source: "grimoire_event",
    label: "Golem Smash",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Golem, you've killed ${count} player${pluralize(count)}.`
          : `As the Golem, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Golem, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Golem.`
        : `No Golem has killed a player yet.`,
  },
  {
    id: "golem_evil_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["golem"],
    script: "experimental",
    source: "grimoire_event",
    label: "Crushing Evil",
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
          ? `As the Golem, you've killed ${count} evil player${pluralize(count)}.`
          : `As the Golem, this player has killed ${count} evil player${pluralize(count)}.`)
        : `As the Golem, kill an evil player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} evil player${pluralize(count)} ${wasWere(count)} killed by a Golem.`
        : `No Golem has killed an evil player yet.`,
  },
  {
    id: "goon_alignment_changes",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["goon"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Shifting Loyalties",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Goon, you've changed alignment ${count} time${pluralize(count)}.`
          : `As the Goon, this player has changed alignment ${count} time${pluralize(count)}.`)
        : `As the Goon, change alignment.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Goon has changed alignment at least ${count} time${pluralize(count)}.`
        : `No Goon has changed alignment yet.`,
  },
  {
    id: "goon_drunk_received",
    category: "role",
    roleIds: ["goon"],
    scope: "affected_player",
    globalDataNeeds: ["grimoire_events"],
    script: "bmr",
    sao: 1,
    source: "grimoire_event",
    label: "Friendly Explanations",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "goon"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've ended up drunk ${count} time${pluralize(count)} after picking the Goon.`
          : `This player has ended up drunk ${count} time${pluralize(count)} after picking the Goon.`)
        : `Become drunk after picking the Goon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has become drunk after picking the Goon at least ${count} time${pluralize(count)}.`
        : `No player has become drunk after picking the Goon yet.`,
  },
  {
    id: "hatter_role_changes",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["hatter"],
    script: "experimental",
    source: "grimoire_event",
    label: "Tea Party Tonight",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ROLE_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Hatter, you've caused ${count} evil character change${pluralize(count)} when you died.`
          : `As the Hatter, this player has caused ${count} evil character change${pluralize(count)} when they died.`)
        : `As the Hatter, cause evil players to change characters when you die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} evil character change${pluralize(count)} ${wasWere(count)} caused by a Hatter dying.`
        : `No Hatter has caused evil players to change characters yet.`,
  },
  // Heretic: Nothing to track really.
  // Hermit: Too complex?
  {
    id: "klutz_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["klutz"],
    script: "snv",
    sao: 4,
    source: "end_trigger",
    label: "Fatal Fumble",
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
          ? `As the Klutz, you've caused ${count} game${pluralize(count)} to end by making the wrong choice.`
          : `As the Klutz, this player has caused ${count} game${pluralize(count)} to end by making the wrong choice.`)
        : `As the Klutz, cause a game to end by making the wrong choice.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Klutz making the wrong choice.`
        : `No Klutz has ended a game by making the wrong choice yet.`,
  },
  {
    id: "lunatic_followed_picks",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["lunatic"],
    script: "bmr",
    sao: 2,
    source: "grimoire_event",
    label: "Make Believe",
    getCount: ({ games, roleId }) =>
      games.reduce((total, game) => {
        if (!roleId || game.ignore_for_stats) return total;

        const chosenEvents = game.grimoire_events.filter(
          (event) =>
            event.by_role_id === roleId &&
            event.event_type === GrimoireEventType.OTHER &&
            event.status_source === "Chosen"
        );

        const followedPicks = chosenEvents.filter((chosenEvent) =>
          game.grimoire_events.some(
            (event) =>
              event.event_type === GrimoireEventType.DEATH &&
              event.participant_id === chosenEvent.participant_id &&
              event.grimoire_page === chosenEvent.grimoire_page &&
              isDemonKillEvent(game, event)
          )
        ).length;

        return total + followedPicks;
      }, 0),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Lunatic, you've had the Demon follow and kill ${count} of your choice${pluralize(count)}.`
          : `As the Lunatic, this player has had the Demon follow and kill ${count} of their choice${pluralize(count)}.`)
        : `As the Lunatic, have the Demon follow and kill a player you chose.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} Lunatic choice${pluralize(count)} ${wasWere(count)} followed and killed by the Demon.`
        : `No Demon has followed and killed a Lunatic choice yet.`,
  },
  // Lunatic not followed would be cool, but too hard/too legacy to track?
  {
    id: "moonchild_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["moonchild"],
    script: "bmr",
    sao: 4,
    source: "grimoire_event",
    label: "Star-Crossed",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Moonchild, you've killed ${count} player${pluralize(count)}.`
          : `As the Moonchild, this player has killed ${count} player${pluralize(count)}.`)
        : `As the Moonchild, kill a player.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} killed by a Moonchild.`
        : `No Moonchild has killed a player yet.`,
  },
  {
    id: "moonchild_spy_kills",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["moonchild"],
    script: "experimental", // Not possible on their base script
    source: "grimoire_event",
    label: "A Crooked Constellation",
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
              currentToken?.role_id === "spy" ||
              previousToken?.role_id === "spy"
            );
          }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Moonchild, you've killed the Spy ${count} time${pluralize(count)}.`
          : `As the Moonchild, this player has killed the Spy ${count} time${pluralize(count)}.`)
        : `As the Moonchild, kill the Spy.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Spy has been killed by a Moonchild due to misregistering as Good at least ${count} time${pluralize(count)}.`
        : `No Spy has been killed by a Moonchild due to misregistering as Good yet.`,
  },
  {
    id: "mutant_executions",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["mutant"],
    script: "snv",
    sao: 1,
    source: "grimoire_event",
    label: "Slip of the Tongue",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.EXECUTION),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Mutant, you've been executed ${count} time${pluralize(count)} for breaking madness.`
          : `As the Mutant, this player has been executed ${count} time${pluralize(count)} for breaking madness.`)
        : `As the Mutant, be executed for breaking madness.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Mutant has been executed for breaking madness at least ${count} time${pluralize(count)}.`
        : `No Mutant has been executed for breaking madness yet.`,
  },
  {
    id: "mutant_execution_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["mutant"],
    script: "snv",
    sao: 1,
    hidden: true,
    source: "end_trigger",
    label: "No Mercy",
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
          ? `As the Mutant, you've caused ${count} game${pluralize(count)} to end by being executed for breaking madness, leaving only two players alive.`
          : `As the Mutant, this player has caused ${count} game${pluralize(count)} to end by being executed for breaking madness, leaving only two players alive.`)
        : `As the Mutant, cause a game to end by being executed for breaking madness, leaving only two players alive.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Mutant being executed for breaking madness, leaving only two players alive.`
        : `No Mutant has ended a game by being executed for breaking madness yet.`,
  },
  {
    id: "ogre_alignment_changes",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["ogre"],
    script: "experimental",
    source: "grimoire_event",
    label: "Friend or Foe?",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Ogre, you've changed alignment ${count} time${pluralize(count)}.`
          : `As the Ogre, this player has changed alignment ${count} time${pluralize(count)}.`)
        : `As the Ogre, change alignment.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `An Ogre has changed alignment at least ${count} time${pluralize(count)}.`
        : `No Ogre has changed alignment yet.`,
  },
  {
    id: "plague_doctor_storyteller_abilities",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["plague_doctor"],
    script: "experimental",
    source: "grimoire_event",
    label: "Doctor's Orders",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Storyteller Ability"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Plague Doctor, you've given the Storyteller an ability ${count} time${pluralize(count)}.`
          : `As the Plague Doctor, this player has given the Storyteller an ability ${count} time${pluralize(count)}.`)
        : `As the Plague Doctor, give the Storyteller an ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Plague Doctor has given the Storyteller an ability at least ${count} time${pluralize(count)}.`
        : `No Plague Doctor has given the Storyteller an ability yet.`,
  },
  {
    id: "politician_alignment_changes",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["politician"],
    script: "experimental",
    source: "grimoire_event",
    label: "Crossing the Aisle",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.ALIGNMENT_CHANGE),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Politician, you've changed alignment at the end of ${count} game${pluralize(count)}.`
          : `As the Politician, this player has changed alignment at the end of ${count} game${pluralize(count)}.`)
        : `As the Politician, change alignment at the end of a game.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Politician has changed alignment at the end of at least ${count} game${pluralize(count)}.`
        : `No Politician has changed alignment at the end of a game yet.`,
  },
  {
    id: "puzzlemaster_guesses_used",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["puzzlemaster"],
    script: "experimental",
    sao: 4,
    source: "grimoire_event",
    label: "Brain Teaser",
    getCount: ({ games, roleId }) =>
      !roleId
        ? 0
        : countMatchingEvents(
            games,
            (_, event) =>
              event.by_role_id === roleId &&
              event.event_type === GrimoireEventType.OTHER &&
              event.status_source === "Guess Used"
          ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Puzzlemaster, you've used your guess ${count} time${pluralize(count)}.`
          : `As the Puzzlemaster, this player has used their guess ${count} time${pluralize(count)}.`)
        : `As the Puzzlemaster, use your guess.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Puzzlemaster has used their guess at least ${count} time${pluralize(count)}.`
        : `No Puzzlemaster has used their guess yet.`,
  },
  {
    id: "puzzlemaster_correct_guesses",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    roleIds: ["puzzlemaster"],
    script: "experimental",
    sao: 4,
    source: "grimoire_event",
    label: "Solved",
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
          ? `As the Puzzlemaster, you've guessed correctly and seen the Demon ${count} time${pluralize(count)}.`
          : `As the Puzzlemaster, this player has guessed correctly and seen the Demon ${count} time${pluralize(count)}.`)
        : `As the Puzzlemaster, guess correctly and see the Demon.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Puzzlemaster has guessed correctly and seen the Demon at least ${count} time${pluralize(count)}.`
        : `No Puzzlemaster has guessed correctly and seen the Demon yet.`,
  },
  {
    id: "puzzlemaster_drunk_received",
    category: "role",
    roleIds: ["puzzlemaster"],
    scope: "affected_player",
    globalDataNeeds: ["grimoire_events"],
    script: "experimental",
    sao: 4,
    source: "grimoire_event",
    label: "Puzzledrunk",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "puzzlemaster"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been made drunk by the Puzzlemaster ${count} time${pluralize(count)}.`
          : `This player has been made drunk by the Puzzlemaster ${count} time${pluralize(count)}.`)
        : `Be made drunk by the Puzzlemaster.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A player has been made drunk by a Puzzlemaster at least ${count} time${pluralize(count)}.`
        : `No player has been made drunk by a Puzzlemaster yet.`,
  },
  {
    id: "recluse_fortune_teller_received",
    category: "role",
    scope: "affected_player",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    script: "tb",
    roleIds: ["recluse"],
    sao: 3,
    source: "grimoire_event",
    label: "Unlucky Reading",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
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
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has been seen as a Demon by a Fortune Teller at least ${count} time${pluralize(count)}.`
        : `No Recluse has been seen as a Demon by a Fortune Teller yet.`,
  },
  {
    id: "recluse_investigator_received",
    category: "role",
    scope: "affected_player",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    script: "tb",
    roleIds: ["recluse"],
    sao: 3,
    source: "grimoire_event",
    label: "Branded Guilty",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (game, event) => {
          if (
            event.event_type !== GrimoireEventType.OTHER ||
            event.by_role_id !== "investigator" ||
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
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Recluse, you've been seen as a Minion by the Investigator ${count} time${pluralize(count)}.`
          : `As the Recluse, this player has been seen as a Minion by the Investigator ${count} time${pluralize(count)}.`)
        : `As the Recluse, be seen as a Minion by the Investigator.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has been seen as a Minion by an Investigator at least ${count} time${pluralize(count)}.`
        : `No Recluse has been seen as a Minion by an Investigator yet.`,
  },
  {
    id: "recluse_imp_starpasses_received",
    category: "role",
    roleIds: ["recluse"],
    scope: "affected_player",
    globalDataNeeds: ["grimoire_events", "grimoire_state"],
    script: "tb",
    sao: 3,
    hidden: true,
    source: "grimoire_event",
    label: "Yes, but Don't",
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
          const previousToken = getEventPreviousToken(game, event);

          return (
            currentToken?.role_id === "imp" &&
            (event.old_role_id === "recluse" || previousToken?.role_id === "recluse")
          );
        }
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Recluse, you've become the Imp ${count} time${pluralize(count)} after the Imp targeted themselves with their ability.`
          : `As the Recluse, this player has become the Imp ${count} time${pluralize(count)} after the Imp targeted themselves with their ability.`)
        : `As the Recluse, become the Imp after the Imp targets themselves with their ability.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Recluse has become the Imp after the Imp targeted themselves at least ${count} time${pluralize(count)}.`
        : `No Recluse has become the Imp after the Imp targeted themselves yet.`,
  },
  {
    id: "saint_game_endings",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["saint"],
    script: "tb",
    sao: 2,
    source: "end_trigger",
    label: "Holy Misfire",
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
          ? `As the Saint, you've caused ${count} game${pluralize(count)} to end by being executed.`
          : `As the Saint, this player has caused ${count} game${pluralize(count)} to end by being executed.`)
        : `As the Saint, cause a game to end by being executed.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} game${pluralize(count)} ${wasWere(count)} ended by a Saint being executed.`
        : `No Saint has ended a game by being executed yet.`,
  },
  {
    id: "saint_game_endings_caused",
    category: "role",
    roleIds: ["saint"],
    scope: "triggering_player",
    script: "tb",
    sao: 2,
    hidden: true,
    source: "end_trigger",
    label: "Condemned the Holy",
    getCount: ({ games }) =>
      countMatchingEvents(games, (game, event) => {
        const endedBySaintAbility =
          game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
          game.end_trigger_cause === GameEndTriggerCause.ABILITY &&
          game.end_trigger_role_id === "saint";
        if (!endedBySaintAbility || event.event_type !== GrimoireEventType.EXECUTION) {
          return false;
        }

        const currentToken = getEventCurrentToken(game, event);
        const previousToken = getEventPreviousToken(game, event);

        return (
          currentToken?.role_id === "saint" ||
          previousToken?.role_id === "saint"
        );
      }),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've ended ${count} game${pluralize(count)} by executing the Saint.`
          : `This player has ended ${count} game${pluralize(count)} by executing the Saint.`)
        : `End a game by executing the Saint.`,
  },
  // Snitch: Nothing relevant. Only option: None?
  {
    id: "sweetheart_drunk_on_death",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["sweetheart"],
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Heartbreak Hangover", // @todo Revisit title.
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DRUNK),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Sweetheart, you've made ${count} player${pluralize(count)} drunk when you died.`
          : `As the Sweetheart, this player has made ${count} player${pluralize(count)} drunk when they died.`)
        : `As the Sweetheart, make a player drunk when you die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `At least ${count} player${pluralize(count)} ${wasWere(count)} made drunk by a Sweetheart dying.`
        : `No Sweetheart has made a player drunk by dying yet.`,
  },
  {
    id: "sweetheart_drunk_received",
    category: "role",
    roleIds: ["sweetheart"],
    scope: "affected_player",
    script: "snv",
    sao: 2,
    source: "grimoire_event",
    label: "Grief-Struck",
    getCount: ({ games }) =>
      countMatchingEvents(
        games,
        (_, event) =>
          event.event_type === GrimoireEventType.DRUNK &&
          event.by_role_id === "sweetheart"
      ),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `You've been made drunk by the Sweetheart ${count} time${pluralize(count)}.`
          : `This player has been made drunk by the Sweetheart ${count} time${pluralize(count)}.`)
        : `Be made drunk by the Sweetheart.`,
  },
  {
    id: "tinker_deaths_self",
    category: "role",
    scope: "as_role",
    globalDataNeeds: ["grimoire_events"],
    roleIds: ["tinker"],
    script: "bmr",
    sao: 3,
    source: "grimoire_event",
    label: "Oops!",
    getCount: ({ games, roleId }) =>
      countGrimoireEvents(games, roleId, GrimoireEventType.DEATH),
    getSentence: ({ count, isMe }) =>
      count > 0
        ? (isMe
          ? `As the Tinker, you've died ${count} time${pluralize(count)}.`
          : `As the Tinker, this player has died ${count} time${pluralize(count)}.`)
        : `As the Tinker, die.`,
    getGlobalSentence: ({ count }) =>
      count > 0
        ? `A Tinker has died at least ${count} time${pluralize(count)}.`
        : `No Tinker has died yet.`,
  },
  // Zealot: Nothing relevant. Only option: None?
];
