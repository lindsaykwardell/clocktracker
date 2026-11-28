import { GrimoireEventType } from "~/composables/useGames";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/composables/grimoireReminderEventConfig";
import {
  assignParticipantIds,
  isEmptySeat,
  matchPageTokens,
  seatMoves,
} from "~/composables/grimoireParticipantMatching";
import { isSeatMovingScript } from "~/utils/grimoireChecks";
import { reminderRoleId, type ReminderCatalog } from "~/shared/reminderCatalog";
import { isImaginedAbilitySource } from "~/shared/imaginedAbility";
import {
  carriedOverReminders,
  type LifetimeMarkedPage,
  type LifetimePage,
} from "~/shared/reminderLifetimes";

export type ReminderLike = {
  reminder: string;
  token_url: string;
  role_reminder_id?: number | null;
};

export type GrimoireTokenLike = {
  order: number;
  player_name: string;
  player_id?: string | null;
  role_id: string | null;
  related_role_id?: string | null;
  alignment?: "GOOD" | "EVIL" | "NEUTRAL";
  is_dead: boolean;
  grimoire_participant_id?: string | null;
  reminders: ReminderLike[];
  role?: {
    name?: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
  related_role?: {
    name?: string;
    token_url: string;
  };
};

export type GrimoireEventEngineContext = {
  /** The pages of the game being edited. */
  getGrimoire: () => ({ tokens: GrimoireTokenLike[] } & LifetimeMarkedPage)[];
  /** A role by id; its name is used to recognise a reminder's role. */
  resolveRoleById: (
    roleId: string | null | undefined
  ) => { name?: string | null } | null | undefined;
  /**
   * The reminder catalog, to read a reminder's role from its catalog link or
   * icon. Without it (or for a reminder it doesn't know) the role is guessed
   * from the role names in the icon.
   */
  getCatalog?: () => ReminderCatalog | null | undefined;
  /**
   * The game's script name. In Musical Chairs the shroud stays with the seat
   * when players move (see buildExpectations).
   */
  getScript?: () => string | null | undefined;
};

/**
 * The editor's rules for which events a grimoire implies (deaths, revivals,
 * role/seat/alignment changes and reminder-driven events). The component keeps
 * the reconciliation with the events already recorded.
 */
export function createGrimoireEventEngine(context: GrimoireEventEngineContext) {
  function isReviveEventType(eventType: GrimoireEventType | null) {
    return eventType === GrimoireEventType.REVIVE;
  }

  /**
   * Normalizes reminder token hints so they can be matched against role ids and names.
   */
  function normalizeReminderRoleHint(value: string | null | undefined) {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /** The role a reminder came from, when the catalog knows it. */
  function catalogRoleId(reminder: ReminderLike) {
    return reminderRoleId(context.getCatalog?.(), reminder);
  }

  /**
   * Whether a reminder says which role it came from: through the catalog, or
   * else an icon to guess the role from.
   */
  function hasRoleHint(reminder: ReminderLike) {
    return !!catalogRoleId(reminder) || !!normalizeReminderRoleHint(reminder.token_url);
  }

  /**
   * Whether a reminder came from this token's character: the catalog role when
   * known, or else the role's name or id found in the reminder's icon.
   */
  function reminderHintMatchesCharacter(
    reminder: ReminderLike,
    candidate: { role_id: string | null; role?: { name?: string } }
  ) {
    if (!candidate.role_id) return false;
    const roleId = catalogRoleId(reminder);
    if (roleId) return candidate.role_id === roleId;

    const reminderUrlHint = normalizeReminderRoleHint(reminder.token_url);
    if (!reminderUrlHint) return false;
    const roleNameHint = normalizeReminderRoleHint(candidate.role?.name);
    const roleIdHint = normalizeReminderRoleHint(candidate.role_id);
    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  }

  function normalizeReminderName(value: string | null | undefined) {
    const normalized = (value ?? "").trim().toLowerCase();
    if (/^drunk\s+\d+$/.test(normalized)) return "drunk";
    return normalized;
  }

  function countReminderByName(
    reminders: ReminderLike[] | undefined,
    reminderName: string
  ) {
    const normalizedReminderName = normalizeReminderName(reminderName);
    return (reminders ?? []).reduce((count, reminder) => {
      return normalizeReminderName(reminder.reminder) === normalizedReminderName
        ? count + 1
        : count;
    }, 0);
  }

  function addedRemindersByName(
    currentReminders: ReminderLike[] | undefined,
    previousReminders: ReminderLike[] | undefined,
    reminderName: string
  ) {
    const normalizedReminderName = normalizeReminderName(reminderName);
    const previousCounts = new Map<string, number>();

    for (const reminder of previousReminders ?? []) {
      if (normalizeReminderName(reminder.reminder) !== normalizedReminderName) continue;
      const key = `${normalizedReminderName}|${reminder.token_url ?? ""}`;
      previousCounts.set(key, (previousCounts.get(key) ?? 0) + 1);
    }

    const added: ReminderLike[] = [];
    for (const reminder of currentReminders ?? []) {
      if (normalizeReminderName(reminder.reminder) !== normalizedReminderName) continue;
      const key = `${normalizedReminderName}|${reminder.token_url ?? ""}`;
      const available = previousCounts.get(key) ?? 0;
      if (available > 0) {
        previousCounts.set(key, available - 1);
        continue;
      }
      added.push(reminder);
    }

    return added;
  }

  function reminderMatchesAnyRoleHint(
    reminder: ReminderLike,
    roleIds: string[]
  ) {
    const catalogRole = catalogRoleId(reminder);
    if (catalogRole) return roleIds.includes(catalogRole);

    const reminderUrlHint = normalizeReminderRoleHint(reminder.token_url);
    if (!reminderUrlHint) return false;

    return roleIds.some((roleId) => {
      const roleNameHint = normalizeReminderRoleHint(context.resolveRoleById(roleId)?.name);
      const roleIdHint = normalizeReminderRoleHint(roleId);
      return (
        (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
        (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
      );
    });
  }

  /**
   * Reminders whose source usually no longer holds the role on the page the
   * reminder is placed: the Fang Gu jumped, the Snake Charmer swapped with the
   * Demon, the Philosopher took another character. For these the source is the
   * player who held the role on the previous page.
   */
  const PREVIOUS_PAGE_SOURCE_REMINDERS: { reminder: string; roleId: string }[] = [
    { reminder: "jumped", roleId: "fang_gu" },
    { reminder: "poisoned", roleId: "snake_charmer" },
    { reminder: "drunk", roleId: "philosopher" },
  ];

  /** The added reminders whose source should be looked up on the previous page. */
  function previousPageSourceReminders(
    config: { reminder: string; sourceRoleIds: string[] },
    remindersWithRoleHint: ReminderLike[]
  ) {
    const reminderName = normalizeReminderName(config.reminder);
    const roleIds = PREVIOUS_PAGE_SOURCE_REMINDERS.filter(
      (entry) =>
        entry.reminder === reminderName &&
        config.sourceRoleIds.includes(entry.roleId)
    ).map((entry) => entry.roleId);
    if (roleIds.length === 0) return [];
    return remindersWithRoleHint.filter((reminder) =>
      reminderMatchesAnyRoleHint(reminder, roleIds)
    );
  }

  function detectReminderEventSource(
    pageTokens: GrimoireTokenLike[],
    sourceRoleIds: string[],
    remindersWithRoleHint: ReminderLike[] = []
  ) {
    if (!sourceRoleIds.length) return null;
    const allowed = new Set(sourceRoleIds);
    const baseCandidates = pageTokens.filter(
      (candidate) => !!candidate.role_id && allowed.has(candidate.role_id)
    );
    const hintedCandidates = remindersWithRoleHint.length
      ? baseCandidates.filter(
          (candidate) =>
            !!candidate.role_id &&
            remindersWithRoleHint.some((reminder) =>
              reminderMatchesAnyRoleHint(reminder, [candidate.role_id as string])
            )
        )
      : [];

    if (remindersWithRoleHint.length > 0 && hintedCandidates.length === 0) {
      return null;
    }

    const candidates =
      hintedCandidates.length > 0 ? hintedCandidates : baseCandidates;

    const aliveCandidates = candidates.filter((candidate) => !candidate.is_dead);
    if (aliveCandidates.length === 1 && aliveCandidates[0].grimoire_participant_id) {
      return {
        by_participant_id: aliveCandidates[0].grimoire_participant_id,
        by_role_id: aliveCandidates[0].role_id as string,
      };
    }

    const deadCandidates = candidates.filter((candidate) => candidate.is_dead);
    if (deadCandidates.length === 1 && deadCandidates[0].grimoire_participant_id) {
      return {
        by_participant_id: deadCandidates[0].grimoire_participant_id,
        by_role_id: deadCandidates[0].role_id as string,
      };
    }

    return null;
  }

  function resolveHintSourceRoleIds(
    sourceRoleIds: string[],
    remindersWithRoleHint: ReminderLike[]
  ) {
    const roleIds = new Set<string>();
    for (const roleId of sourceRoleIds) {
      if (
        remindersWithRoleHint.some((reminder) =>
          reminderMatchesAnyRoleHint(reminder, [roleId])
        )
      ) {
        roleIds.add(roleId);
      }
    }
    return Array.from(roleIds);
  }

  function detectNpcReminderEventSource(
    sourceRoleIds: string[],
    remindersWithRoleHint: ReminderLike[] = []
  ) {
    if (!sourceRoleIds.length) return null;
    if (sourceRoleIds.length === 1) {
      return {
        by_participant_id: null,
        by_role_id: sourceRoleIds[0],
      };
    }

    const hintedRoleIds = sourceRoleIds.filter((roleId) =>
      remindersWithRoleHint.some((reminder) =>
        reminderMatchesAnyRoleHint(reminder, [roleId])
      )
    );
    if (hintedRoleIds.length === 1) {
      return {
        by_participant_id: null,
        by_role_id: hintedRoleIds[0],
      };
    }

    return null;
  }

  function matchesTargetScope(
    config: {
      reminder: string;
      eventType: GrimoireEventType;
      sourceRoleIds: string[];
      sourceMode?: "participant" | "npc";
      targetScope?: "self" | "others" | "all";
      targetRoleIds?: string[];
    },
    tokenRoleId: string | null | undefined
  ) {
    if (!tokenRoleId) return false;
    if (config.targetScope === "self") {
      return config.sourceRoleIds.includes(tokenRoleId);
    }
    if (config.targetScope === "others") {
      return !config.sourceRoleIds.includes(tokenRoleId);
    }
    if (config.targetRoleIds?.length) {
      return config.targetRoleIds.includes(tokenRoleId);
    }
    return true;
  }

  function matchesTargetStateRestrictions(
    config: {
      reminder: string;
      sourceRoleIds: string[];
      sourceMode?: "participant" | "npc";
    },
    token: { is_dead: boolean }
  ) {
    const normalizedReminder = normalizeReminderName(config.reminder);
    const isBoneCollectorHasAbility =
      normalizedReminder === "has ability" &&
      config.sourceRoleIds.includes("bone_collector");

    if (isBoneCollectorHasAbility) {
      return token.is_dead;
    }

    return true;
  }

  function blockedBySelfScopedRoleHintOverride(
    config: {
      reminder: string;
      eventType: GrimoireEventType;
      sourceRoleIds: string[];
      sourceMode?: "participant" | "npc";
      targetScope?: "self" | "others" | "all";
      targetRoleIds?: string[];
    },
    tokenRoleId: string | null | undefined,
    remindersWithRoleHint: ReminderLike[]
  ) {
    if (!tokenRoleId || remindersWithRoleHint.length === 0) return false;
    if (config.targetScope || config.targetRoleIds?.length) return false;
    if (config.sourceRoleIds.length > 0) return false;

    const selfScopedRoleIds = GRIMOIRE_REMINDER_EVENT_CONFIG.filter(
      (candidate) =>
        normalizeReminderName(candidate.reminder) ===
          normalizeReminderName(config.reminder) &&
        candidate.eventType === config.eventType &&
        candidate.targetScope === "self" &&
        candidate.sourceRoleIds.length > 0
    ).flatMap((candidate) => candidate.sourceRoleIds);

    if (selfScopedRoleIds.length === 0) return false;

    const hintedSelfScopedRoleIds = selfScopedRoleIds.filter((roleId) =>
      remindersWithRoleHint.some((reminder) =>
        reminderMatchesAnyRoleHint(reminder, [roleId])
      )
    );
    if (hintedSelfScopedRoleIds.length === 0) return false;

    return !hintedSelfScopedRoleIds.includes(tokenRoleId);
  }

  /**
   * Tries to infer a death source from a placed "Dead" reminder token on the page,
   * because reminder token URLs often preserve enough role identity to make a safe autofill.
   */
  function detectDeadReminderSource(
    pageTokens: GrimoireTokenLike[],
    token: { reminders: ReminderLike[] }
  ) {
    const deadReminder = token.reminders.find(
      (reminder) => reminder.reminder.trim().toLowerCase() === "dead"
    );
    if (!deadReminder?.token_url) return null;
    if (!hasRoleHint(deadReminder)) return null;

    const matchingCharacters = pageTokens.filter((candidate) =>
      reminderHintMatchesCharacter(deadReminder, candidate)
    );

    const matchingAliveCharacters = matchingCharacters.filter(
      (candidate) => !candidate.is_dead
    );
    const matchingDeadCharacters = matchingCharacters.filter(
      (candidate) => candidate.is_dead
    );

    const matchedCharacters =
      matchingAliveCharacters.length === 1
        ? matchingAliveCharacters
        : matchingDeadCharacters.length === 1
          ? matchingDeadCharacters
          : [];

    if (matchedCharacters.length !== 1) return null;

    const [source] = matchedCharacters;
    if (!source.grimoire_participant_id || !source.role_id) return null;

    return {
      by_participant_id: source.grimoire_participant_id,
      by_role_id: source.role_id,
    };
  }

  function detectSourceFromReminderHint(
    sourceTokens: GrimoireTokenLike[],
    reminder: ReminderLike
  ) {
    if (!hasRoleHint(reminder)) return null;

    const matchingCharacters = sourceTokens.filter((candidate) =>
      reminderHintMatchesCharacter(reminder, candidate)
    );

    const matchingAliveCharacters = matchingCharacters.filter(
      (candidate) => !candidate.is_dead
    );
    const matchingDeadCharacters = matchingCharacters.filter(
      (candidate) => candidate.is_dead
    );

    const matchedCharacters =
      matchingAliveCharacters.length === 1
        ? matchingAliveCharacters
        : matchingDeadCharacters.length === 1
          ? matchingDeadCharacters
          : matchingCharacters.length === 1
            ? matchingCharacters
            : [];

    if (matchedCharacters.length !== 1) return null;
    const [source] = matchedCharacters;
    if (!source.grimoire_participant_id || !source.role_id) return null;

    return {
      by_participant_id: source.grimoire_participant_id,
      by_role_id: source.role_id,
    };
  }

  const SELF_ONLY_CHANGED_SOURCE_ROLE_IDS = new Set([
    "politician",
    "ogre",
    "goon",
    "farmer",
    "scarlet_woman",
  ]);

  function isFarmerChangedReminder(reminder: ReminderLike) {
    const roleId = catalogRoleId(reminder);
    if (roleId) return roleId === "farmer";
    return normalizeReminderRoleHint(reminder.token_url).includes("farmer");
  }

  function detectMostRecentlyDiedFarmerSource(
    currentPageTokens: GrimoireTokenLike[],
    previousPageTokens: GrimoireTokenLike[]
  ) {
    const farmers = currentPageTokens.filter(
      (token) => token.role_id === "farmer" && !!token.grimoire_participant_id
    );
    if (farmers.length === 0) return null;

    const previousByParticipantId = new Map<string, GrimoireTokenLike>();
    for (const token of previousPageTokens) {
      if (!token.grimoire_participant_id) continue;
      previousByParticipantId.set(token.grimoire_participant_id, token);
    }

    const justDiedFarmers = farmers.filter((token) => {
      if (!token.grimoire_participant_id || !token.is_dead) return false;
      const previous = previousByParticipantId.get(token.grimoire_participant_id);
      return previous ? !previous.is_dead : true;
    });
    if (justDiedFarmers.length > 0) {
      const source = justDiedFarmers[justDiedFarmers.length - 1];
      return {
        by_participant_id: source.grimoire_participant_id as string,
        by_role_id: "farmer",
      };
    }

    const deadFarmers = farmers.filter((token) => token.is_dead);
    if (deadFarmers.length > 0) {
      const source = deadFarmers[deadFarmers.length - 1];
      return {
        by_participant_id: source.grimoire_participant_id as string,
        by_role_id: "farmer",
      };
    }

    return null;
  }

  function resolveChangedReminderSource(
    reminder: ReminderLike,
    pageIndex: number,
    currentPageTokens: GrimoireTokenLike[]
  ) {
    const normalizedReminder = normalizeReminderName(reminder.reminder);
    const previousPageTokens =
      pageIndex > 0 ? context.getGrimoire()[pageIndex - 1].tokens : [];
    if (isFarmerChangedReminder(reminder)) {
      const farmerSource = detectMostRecentlyDiedFarmerSource(
        currentPageTokens,
        previousPageTokens
      );
      if (farmerSource) return farmerSource;
    }

    if (normalizedReminder === "reincarnated") {
      return detectNpcReminderEventSource(["hindu"], [reminder]);
    }

    return detectSourceFromReminderHint(
      pageIndex > 0 ? previousPageTokens : currentPageTokens,
      reminder
    );
  }

  /**
   * A Scarlet Woman whose token was swapped to the Demon, with her "Is The
   * Demon" on either page (placed although the hint says it's for an unswapped
   * token): the character change is hers, as with "Changed".
   */
  function scarletWomanBecameDemonSource(
    token: GrimoireTokenLike,
    previousToken: GrimoireTokenLike,
    participantId: string
  ): { by_participant_id: string | null; by_role_id: string } | null {
    if (previousToken.role_id !== "scarlet_woman") return null;
    if (token.role?.type !== "DEMON") return null;
    const isTheDemon = [...(token.reminders ?? []), ...(previousToken.reminders ?? [])].find(
      (reminder) => {
        if (normalizeReminderName(reminder.reminder) !== "is the demon") return false;
        // Lil' Monsta's "Is The Demon" is about who babysits it, not her.
        const roleId = catalogRoleId(reminder);
        if (roleId) return roleId === "scarlet_woman";
        const hint = normalizeReminderRoleHint(reminder.token_url);
        return !hint || hint.includes("scarletwoman");
      }
    );
    if (!isTheDemon) return null;
    return { by_participant_id: participantId, by_role_id: "scarlet_woman" };
  }

  function enforceSelfScopedChangedSource(
    source: { by_participant_id: string | null; by_role_id: string } | null,
    targetRoleId: string | null | undefined,
    previousRoleId?: string | null | undefined
  ) {
    if (!source) return null;
    const effectiveRoleIds = [targetRoleId, previousRoleId].filter(
      (roleId): roleId is string => !!roleId
    );
    if (
      SELF_ONLY_CHANGED_SOURCE_ROLE_IDS.has(source.by_role_id) &&
      !effectiveRoleIds.includes(source.by_role_id)
    ) {
      return null;
    }
    return source;
  }

  function findReminderByName(
    reminders: ReminderLike[] | undefined,
    reminderName: string
  ) {
    const normalizedReminderName = normalizeReminderName(reminderName);
    return (
      reminders?.find(
        (reminder) =>
          normalizeReminderName(reminder.reminder) === normalizedReminderName
      ) ?? null
    );
  }

  function findReminderByNames(
    reminders: ReminderLike[] | undefined,
    reminderNames: string[]
  ) {
    for (const reminderName of reminderNames) {
      const found = findReminderByName(reminders, reminderName);
      if (found) return found;
    }
    return null;
  }


  /**
   * Collapses event types into reconciliation buckets used during sync.
   */
  function eventKindFromValues(
    eventType: GrimoireEventType | null
  ):
    | "death"
    | "revival"
    | "role"
    | "seat"
    | "alignment"
    | "mad"
    | "drunk"
    | "poisoned"
    | "other" {
    if (isReviveEventType(eventType)) return "revival";
    if (eventType === GrimoireEventType.ROLE_CHANGE) return "role";
    if (eventType === GrimoireEventType.SEAT_CHANGE) return "seat";
    if (eventType === GrimoireEventType.ALIGNMENT_CHANGE) return "alignment";
    if (eventType === GrimoireEventType.MAD) return "mad";
    if (eventType === GrimoireEventType.DRUNK) return "drunk";
    if (eventType === GrimoireEventType.POISONED) return "poisoned";
    if (eventType === GrimoireEventType.OTHER) return "other";
    return "death";
  }

  /**
   * Builds a reconciliation kind, including status source for status-style events,
   * so reminder-driven OTHER/MAD/DRUNK/POISONED rows do not cross-match.
   */
  function eventReconciliationKind(
    eventType: GrimoireEventType | null,
    statusSource: string | null | undefined
  ) {
    const baseKind = eventKindFromValues(eventType);
    if (
      (eventType === GrimoireEventType.MAD ||
        eventType === GrimoireEventType.DRUNK ||
        eventType === GrimoireEventType.POISONED ||
        eventType === GrimoireEventType.OTHER) &&
      statusSource
    ) {
      return `${baseKind}:${normalizeReminderName(statusSource)}`;
    }
    return baseKind;
  }

  /**
   * Builds the reconciliation key for an expected event entry.
   */
  function expectedKey(grimoirePage: number, participantId: string, kind: string) {
    return `${grimoirePage}:${participantId}:${kind}`;
  }

  /** The events the grimoire implies, keyed by page, participant and kind. */
  function buildExpectations() {
    const grimoire = context.getGrimoire();
    const expected = new Map<
      string,
      {
        grimoire_page: number;
        participant_id: string;
        event_type: GrimoireEventType | null;
        status_source: string | null;
        by_participant_id: string | null;
        player_name: string;
        role_id: string | null;
        by_role_id: string | null;
        old_role_id: string | null;
        new_role_id: string | null;
        old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
        new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
      }
    >();

    // Every id first: an event's source may sit in a later seat, and needs its
    // id when the event is made. Existing ids are kept (events point at them).
    assignParticipantIds(grimoire, { keepExisting: true });
    const deathFollowsSeat = isSeatMovingScript(context.getScript?.());

    grimoire.forEach((page, pageIndex) => {
      const orderedTokens = page.tokens.slice().sort((a, b) => a.order - b.order);
      const previousOrdered =
        pageIndex > 0
          ? grimoire[pageIndex - 1].tokens.slice().sort((a, b) => a.order - b.order)
          : [];
      // The token each one continues on the previous page, for the whole page at once.
      const previousMatches =
        pageIndex > 0 ? matchPageTokens(grimoire[pageIndex - 1].tokens, page.tokens) : null;
      // Who changed seat (see seatMoves): not a name moved onto another
      // character, nor everyone shifted by one player's move.
      const movedTokens = previousMatches
        ? seatMoves(grimoire[pageIndex - 1].tokens, page.tokens, previousMatches)
        : new Set<(typeof page.tokens)[number]>();
      orderedTokens.forEach((token) => {
        const previousToken = previousMatches?.get(token) ?? null;
        // Musical Chairs: the characters stay in their seats and the players
        // move, so the shroud stays with the seat. A player who moved is
        // compared with their new seat on the page before: moving into a
        // dead seat isn't a death, moving out of one isn't a revive.
        // Also for a seat nobody is linked to (an open chair a named player left).
        const seatBefore =
          deathFollowsSeat && pageIndex > 0 && (movedTokens.has(token) || !previousToken)
            ? previousOrdered[orderedTokens.indexOf(token)]
            : previousToken;
        const wasDeadPreviously = seatBefore?.is_dead ?? false;
        const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
        // A dead Traveller's seat that is emptied when they leave is matched
        // to them by seat, but nobody came back to life.
        const shouldHaveRevival = !token.is_dead && wasDeadPreviously && !isEmptySeat(token);

        const participantId = token.grimoire_participant_id as string;
        const deadReminderSource = detectDeadReminderSource(orderedTokens, token);
        const oldRoleId = previousToken?.role_id ?? null;
        const newRoleId = token.role_id ?? null;
        const oldAlignment = previousToken?.alignment ?? null;
        const newAlignment = token.alignment ?? null;

        if (shouldHaveDeath) {
          expected.set(expectedKey(pageIndex, participantId, "death"), {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: deadReminderSource
              ? GrimoireEventType.DEATH
              : GrimoireEventType.NOT_RECORDED,
            by_participant_id: deadReminderSource?.by_participant_id ?? null,
            status_source: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: deadReminderSource?.by_role_id ?? null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }

        if (shouldHaveRevival) {
          expected.set(expectedKey(pageIndex, participantId, "revival"), {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.REVIVE,
            status_source: null,
            by_participant_id: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }

        if (!previousToken && pageIndex === 0) {
          const initialAlignment = token.role?.initial_alignment ?? null;
          const isTraveler = token.role?.type === "TRAVELER";
          if (
            !isTraveler &&
            initialAlignment &&
            token.alignment &&
            token.alignment !== initialAlignment
          ) {
            // A "Changed" or "Turns Evil" reminder on the seat says who did it
            // (a Bounty Hunter's evil Townsfolk), as on later pages.
            const setupReminder = findReminderByNames(token.reminders, [
              "Changed",
              "Turns Evil",
            ]);
            const setupSource = enforceSelfScopedChangedSource(
              setupReminder
                ? resolveChangedReminderSource(setupReminder, pageIndex, orderedTokens)
                : null,
              token.role_id
            );
            expected.set(expectedKey(pageIndex, participantId, "alignment"), {
              grimoire_page: pageIndex,
              participant_id: participantId,
              event_type: GrimoireEventType.ALIGNMENT_CHANGE,
              status_source: null,
              by_participant_id: setupSource?.by_participant_id ?? null,
              player_name: token.player_name || "",
              role_id: token.role_id ?? null,
              by_role_id: setupSource?.by_role_id ?? null,
              old_role_id: oldRoleId,
              new_role_id: newRoleId,
              old_alignment: initialAlignment,
              new_alignment: newAlignment,
            });
          }
        }

        if (previousToken) {
          const changedReminder =
            findReminderByNames(token.reminders, ["Changed", "Reincarnated"]) ??
            findReminderByNames(previousToken.reminders, [
              "Changed",
              "Reincarnated",
            ]);
          const alignmentChangedReminder =
            findReminderByNames(token.reminders, ["Changed", "Turns Evil"]) ??
            findReminderByNames(previousToken.reminders, ["Changed", "Turns Evil"]);
          const changedSource = enforceSelfScopedChangedSource(
            changedReminder
              ? resolveChangedReminderSource(
                  changedReminder,
                  pageIndex,
                  orderedTokens
                )
              : null,
            token.role_id,
            previousToken.role_id
          ) ?? scarletWomanBecameDemonSource(token, previousToken, participantId);
          const alignmentChangedSource = enforceSelfScopedChangedSource(
            alignmentChangedReminder
              ? resolveChangedReminderSource(
                  alignmentChangedReminder,
                  pageIndex,
                  orderedTokens
                )
              : null,
            token.role_id,
            previousToken.role_id
          );

          // Only the main token counts. A new small token on the same character
          // (a Philosopher's choice, a Cannibal's ability) isn't a character change.
          const roleChanged =
            !!token.role_id &&
            !!previousToken.role_id &&
            token.role_id !== previousToken.role_id;
          if (roleChanged) {
            expected.set(expectedKey(pageIndex, participantId, "role"), {
              grimoire_page: pageIndex,
              participant_id: participantId,
              event_type: GrimoireEventType.ROLE_CHANGE,
              status_source: null,
              by_participant_id: changedSource?.by_participant_id ?? null,
              player_name: token.player_name || "",
              role_id: token.role_id ?? null,
              by_role_id: changedSource?.by_role_id ?? null,
              old_role_id: oldRoleId,
              new_role_id: newRoleId,
              old_alignment: oldAlignment,
              new_alignment: newAlignment,
            });
          }

          if (movedTokens.has(token)) {
            expected.set(expectedKey(pageIndex, participantId, "seat"), {
              grimoire_page: pageIndex,
              participant_id: participantId,
              event_type: GrimoireEventType.SEAT_CHANGE,
              status_source: null,
              by_participant_id: null,
              player_name: token.player_name || "",
              role_id: token.role_id ?? null,
              by_role_id: null,
              old_role_id: oldRoleId,
              new_role_id: newRoleId,
              old_alignment: oldAlignment,
              new_alignment: newAlignment,
            });
          }

          // An empty seat on the previous page has no side to switch from: a
          // traveller joining later, or a character filled in late, isn't a switch.
          if (
            !!previousToken.role_id &&
            !!token.role_id &&
            token.alignment !== previousToken.alignment
          ) {
            expected.set(expectedKey(pageIndex, participantId, "alignment"), {
              grimoire_page: pageIndex,
              participant_id: participantId,
              event_type: GrimoireEventType.ALIGNMENT_CHANGE,
              status_source: null,
              by_participant_id: alignmentChangedSource?.by_participant_id ?? null,
              player_name: token.player_name || "",
              role_id: token.role_id ?? null,
              by_role_id: alignmentChangedSource?.by_role_id ?? null,
              old_role_id: oldRoleId,
              new_role_id: newRoleId,
              old_alignment: oldAlignment,
              new_alignment: newAlignment,
            });
          }
        }

        // Reminders placed again on a page with the lifetimes applied count
        // as new (see carriedOverReminders).
        const carriedReminders = carriedOverReminders(
          previousToken?.reminders,
          token,
          page,
          grimoire.slice(0, pageIndex) as LifetimePage[],
          context.getCatalog?.()
        );
        for (const config of GRIMOIRE_REMINDER_EVENT_CONFIG) {
          const previousCount = previousToken
            ? countReminderByName(carriedReminders, config.reminder)
            : 0;
          const currentCount = countReminderByName(token.reminders, config.reminder);
          if (currentCount <= previousCount) continue;
          const addedMatchingNameReminders = addedRemindersByName(
            token.reminders,
            carriedReminders,
            config.reminder
          );
          if (addedMatchingNameReminders.length === 0) continue;
          const addedRemindersWithRoleHint = addedMatchingNameReminders.filter(
            (reminder) => hasRoleHint(reminder)
          );
          if (
            config.sourceRoleIds.length > 0 &&
            addedRemindersWithRoleHint.length > 0 &&
            !addedRemindersWithRoleHint.some((reminder) =>
              reminderMatchesAnyRoleHint(reminder, config.sourceRoleIds)
            )
          ) {
            continue;
          }
          if (!matchesTargetScope(config, token.role_id)) {
            continue;
          }
          if (!matchesTargetStateRestrictions(config, token)) {
            continue;
          }
          if (
            blockedBySelfScopedRoleHintOverride(
              config,
              token.role_id,
              addedRemindersWithRoleHint
            )
          ) {
            continue;
          }

          let source: { by_participant_id: string | null; by_role_id: string } | null =
            null;
          const previousPageHintReminders =
            pageIndex > 0
              ? previousPageSourceReminders(config, addedRemindersWithRoleHint)
              : [];
          if (previousPageHintReminders.length > 0) {
            const previousPageTokens = grimoire[pageIndex - 1].tokens;
            const previousHintSources = previousPageHintReminders
              .map((reminder) =>
                detectSourceFromReminderHint(previousPageTokens, reminder)
              )
              .filter(
                (
                  candidate
                ): candidate is { by_participant_id: string; by_role_id: string } =>
                  !!candidate
              );
            const uniquePrevious = new Map<
              string,
              { by_participant_id: string; by_role_id: string }
            >();
            for (const candidate of previousHintSources) {
              uniquePrevious.set(
                `${candidate.by_participant_id}:${candidate.by_role_id}`,
                candidate
              );
            }
            if (uniquePrevious.size === 1) {
              source = Array.from(uniquePrevious.values())[0];
            }
          }

          if (!source) {
            if (config.sourceMode === "npc") {
              source = detectNpcReminderEventSource(
                config.sourceRoleIds,
                addedRemindersWithRoleHint
              );
            } else {
              source = detectReminderEventSource(
                orderedTokens,
                config.sourceRoleIds,
                addedRemindersWithRoleHint
              );
            }
          }
          if (!source && config.sourceRoleIds.length === 0 && addedRemindersWithRoleHint.length > 0) {
            const hintSources = addedRemindersWithRoleHint
              .map((reminder) => detectSourceFromReminderHint(orderedTokens, reminder))
              .filter(
                (
                  candidate
                ): candidate is { by_participant_id: string; by_role_id: string } =>
                  !!candidate
              );
            const unique = new Map<string, { by_participant_id: string; by_role_id: string }>();
            for (const candidate of hintSources) {
              unique.set(
                `${candidate.by_participant_id}:${candidate.by_role_id}`,
                candidate
              );
            }
            if (unique.size === 1) {
              source = Array.from(unique.values())[0];
            }
          }
          const hintedSourceRoleIds =
            addedRemindersWithRoleHint.length > 0 && config.sourceRoleIds.length > 0
              ? resolveHintSourceRoleIds(
                  config.sourceRoleIds,
                  addedRemindersWithRoleHint
                )
              : [];
          // A reminder from a character nobody has, while a Drunk, Lunatic or
          // Marionette thinks they're it: their "ability" did nothing, so no event
          // (and a death keeps what the shroud says, without this source).
          if (
            !source &&
            isImaginedAbilitySource(
              orderedTokens,
              hintedSourceRoleIds.length > 0
                ? hintedSourceRoleIds
                : config.sourceRoleIds.length > 0
                  ? config.sourceRoleIds
                  : addedRemindersWithRoleHint
                      .map((reminder) => catalogRoleId(reminder))
                      .filter((roleId): roleId is string => !!roleId)
            )
          ) {
            continue;
          }
          const sourceVariants: Array<{
            by_participant_id: string | null;
            by_role_id: string;
          } | null> =
            source
              ? [source]
              : hintedSourceRoleIds.length > 0
                ? hintedSourceRoleIds.map((roleId) => ({
                    by_participant_id: null,
                    by_role_id: roleId,
                  }))
                : [null];

          for (const sourceVariant of sourceVariants) {
            let affectedParticipantId = participantId;
            let affectedToken = token;
            let affectedPreviousToken = previousToken;

            const reminderBaseKind = eventKindFromValues(config.eventType);
            const reminderKind =
              (config.eventType === GrimoireEventType.MAD ||
                config.eventType === GrimoireEventType.DRUNK ||
                config.eventType === GrimoireEventType.POISONED ||
                config.eventType === GrimoireEventType.OTHER) &&
              config.reminder
                ? `${reminderBaseKind}:${normalizeReminderName(config.reminder)}${
                    sourceVariant?.by_role_id
                      ? `:${sourceVariant.by_role_id}`
                      : ""
                  }`
                : reminderBaseKind;

            const reminderExpectedKey = expectedKey(
              pageIndex,
              affectedParticipantId,
              reminderKind
            );
            const existingExpectation = expected.get(reminderExpectedKey);
            const isLifecycleEventType =
              config.eventType === GrimoireEventType.DEATH ||
              config.eventType === GrimoireEventType.EXECUTION ||
              config.eventType === GrimoireEventType.REVIVE;

            // Lifecycle events should only come from shroud/death-state changes.
            // Reminders may enrich those rows but must not create them on their own.
            if (isLifecycleEventType && !existingExpectation) {
              continue;
            }

            let mergedEventType = existingExpectation?.event_type ?? config.eventType;
            if (
              config.eventType === GrimoireEventType.EXECUTION &&
              existingExpectation &&
              (existingExpectation.event_type === null ||
                existingExpectation.event_type === GrimoireEventType.NOT_RECORDED ||
                existingExpectation.event_type === GrimoireEventType.DEATH)
            ) {
              mergedEventType = GrimoireEventType.EXECUTION;
            }
            if (
              config.eventType === GrimoireEventType.DEATH &&
              existingExpectation &&
              (existingExpectation.event_type === null ||
                existingExpectation.event_type === GrimoireEventType.NOT_RECORDED)
            ) {
              mergedEventType = GrimoireEventType.DEATH;
            }

            expected.set(reminderExpectedKey, {
              grimoire_page: pageIndex,
              participant_id: affectedParticipantId,
              event_type: mergedEventType,
              status_source: config.reminder,
              by_participant_id:
                isLifecycleEventType
                  ? existingExpectation?.by_participant_id ??
                    sourceVariant?.by_participant_id ??
                    null
                  : sourceVariant?.by_participant_id ??
                    existingExpectation?.by_participant_id ??
                    null,
              player_name: affectedToken.player_name || "",
              role_id: affectedToken.role_id ?? null,
              by_role_id: isLifecycleEventType
                ? existingExpectation?.by_role_id ?? sourceVariant?.by_role_id ?? null
                : sourceVariant?.by_role_id ?? existingExpectation?.by_role_id ?? null,
              old_role_id:
                affectedPreviousToken?.role_id ??
                existingExpectation?.old_role_id ??
                null,
              new_role_id: affectedToken.role_id ?? null,
              old_alignment:
                affectedPreviousToken?.alignment ??
                existingExpectation?.old_alignment ??
                null,
              new_alignment: affectedToken.alignment ?? null,
            });
          }
        }
      });
    });

    return expected;
  }

  return {
    buildExpectations,
    eventReconciliationKind,
    expectedKey,
    normalizeReminderName,
    reminderMatchesAnyRoleHint,
  };
}
