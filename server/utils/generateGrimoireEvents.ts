import {
  GrimoireEventCause,
  GrimoireEventType,
} from "~/server/generated/prisma/client";
import {
  assignParticipantIds,
  isEmptySeat,
  matchPageTokens,
  seatMoves,
} from "~/composables/grimoireParticipantMatching";
import { isSeatMovingScript } from "~/utils/grimoireChecks";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/server/utils/grimoireReminderEventConfig";
import { reminderRoleId, type ReminderCatalog } from "~/shared/reminderCatalog";
import {
  carriedOverReminders,
  type LifetimeMarkedPage,
  type LifetimePage,
} from "~/shared/reminderLifetimes";

type ReminderLike = {
  reminder: string;
  token_url: string;
  role_reminder_id?: number | null;
};

type TokenLike = {
  id: number;
  order: number;
  player_name: string;
  player_id: string | null;
  role_id: string | null;
  related_role_id: string | null;
  alignment: "GOOD" | "EVIL" | "NEUTRAL";
  is_dead: boolean;
  grimoire_participant_id: string | null;
  reminders: ReminderLike[];
  role?: {
    name: string;
    type?: string | null;
    initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL" | null;
  } | null;
};

type PageLike = {
  id: number;
  tokens: TokenLike[];
} & LifetimeMarkedPage;

type GeneratedEvent = {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType;
  status_source: string | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
};

function normalizeReminderRoleHint(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// The catalog of the run in progress (see generateEventsForMissingGames).
let activeCatalog: ReminderCatalog | null = null;

/** The role a reminder came from, when the catalog knows it. */
function catalogRoleId(reminder: ReminderLike) {
  return reminderRoleId(activeCatalog, reminder);
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
  candidate: { role_id: string | null; role?: { name: string } | null }
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

/** The reminders whose source should be looked up on the previous page. */
function previousPageSourceReminders(
  config: { reminder: string; sourceRoleIds: string[] },
  remindersWithRoleHint: ReminderLike[],
  pageTokens: TokenLike[]
) {
  const reminderName = normalizeReminderName(config.reminder);
  const roleIds = PREVIOUS_PAGE_SOURCE_REMINDERS.filter(
    (entry) =>
      entry.reminder === reminderName &&
      config.sourceRoleIds.includes(entry.roleId)
  ).map((entry) => entry.roleId);
  if (roleIds.length === 0) return [];
  return remindersWithRoleHint.filter((reminder) =>
    reminderMatchesAnyRoleHint(reminder, roleIds, pageTokens)
  );
}

function reminderMatchesAnyRoleHint(
  reminder: ReminderLike,
  roleIds: string[],
  pageTokens: TokenLike[]
) {
  const catalogRole = catalogRoleId(reminder);
  if (catalogRole) return roleIds.includes(catalogRole);

  const reminderUrlHint = normalizeReminderRoleHint(reminder.token_url);
  if (!reminderUrlHint) return false;

  return roleIds.some((roleId) => {
    const roleNameHint = normalizeReminderRoleHint(
      pageTokens.find((token) => token.role_id === roleId)?.role?.name
    );
    const roleIdHint = normalizeReminderRoleHint(roleId);
    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });
}

function detectReminderEventSource(
  pageTokens: TokenLike[],
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
            reminderMatchesAnyRoleHint(
              reminder,
              [candidate.role_id as string],
              pageTokens
            )
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
  remindersWithRoleHint: ReminderLike[],
  pageTokens: TokenLike[]
) {
  const roleIds = new Set<string>();
  for (const roleId of sourceRoleIds) {
    if (
      remindersWithRoleHint.some((reminder) =>
        reminderMatchesAnyRoleHint(reminder, [roleId], pageTokens)
      )
    ) {
      roleIds.add(roleId);
    }
  }
  return Array.from(roleIds);
}

function detectNpcReminderEventSource(
  sourceRoleIds: string[],
  remindersWithRoleHint: ReminderLike[] = [],
  pageTokens: TokenLike[]
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
      reminderMatchesAnyRoleHint(reminder, [roleId], pageTokens)
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
  remindersWithRoleHint: ReminderLike[],
  pageTokens: TokenLike[]
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
      reminderMatchesAnyRoleHint(reminder, [roleId], pageTokens)
    )
  );
  if (hintedSelfScopedRoleIds.length === 0) return false;

  return !hintedSelfScopedRoleIds.includes(tokenRoleId);
}

function detectDeadReminderSource(pageTokens: TokenLike[], token: TokenLike) {
  const deadReminder = token.reminders.find(
    (reminder) => reminder.reminder.trim().toLowerCase() === "dead"
  );
  if (!deadReminder?.token_url) return null;
  if (!hasRoleHint(deadReminder)) return null;

  const matchingCharacters = pageTokens.filter((candidate) =>
    reminderHintMatchesCharacter(deadReminder, candidate)
  );

  const alive = matchingCharacters.filter((candidate) => !candidate.is_dead);
  const dead = matchingCharacters.filter((candidate) => candidate.is_dead);
  const matched = alive.length === 1 ? alive : dead.length === 1 ? dead : [];
  if (matched.length !== 1) return null;

  const source = matched[0];
  if (!source.grimoire_participant_id || !source.role_id) return null;
  return {
    by_participant_id: source.grimoire_participant_id,
    by_role_id: source.role_id,
  };
}

function detectSourceFromReminderHint(
  sourceTokens: TokenLike[],
  reminder: ReminderLike
) {
  if (!hasRoleHint(reminder)) return null;

  const matchingCharacters = sourceTokens.filter((candidate) =>
    reminderHintMatchesCharacter(reminder, candidate)
  );

  const alive = matchingCharacters.filter((candidate) => !candidate.is_dead);
  const dead = matchingCharacters.filter((candidate) => candidate.is_dead);
  const matched =
    alive.length === 1
      ? alive
      : dead.length === 1
        ? dead
        : matchingCharacters.length === 1
          ? matchingCharacters
          : [];
  if (matched.length !== 1) return null;

  const source = matched[0];
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
  currentPageTokens: TokenLike[],
  previousPageTokens: TokenLike[]
) {
  const farmers = currentPageTokens.filter(
    (token) => token.role_id === "farmer" && !!token.grimoire_participant_id
  );
  if (farmers.length === 0) return null;

  const previousByParticipantId = new Map<string, TokenLike>();
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
  currentPageTokens: TokenLike[],
  grimoire: PageLike[]
) {
  const normalizedReminder = normalizeReminderName(reminder.reminder);
  const previousPageTokens = pageIndex > 0 ? grimoire[pageIndex - 1].tokens : [];
  if (isFarmerChangedReminder(reminder)) {
    const farmerSource = detectMostRecentlyDiedFarmerSource(
      currentPageTokens,
      previousPageTokens
    );
    if (farmerSource) return farmerSource;
  }

  if (normalizedReminder === "reincarnated") {
    return detectNpcReminderEventSource(["hindu"], [reminder], currentPageTokens);
  }

  return detectSourceFromReminderHint(
    pageIndex > 0 ? previousPageTokens : currentPageTokens,
    reminder
  );
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

function isLifecycleEventType(eventType: GrimoireEventType) {
  return (
    eventType === GrimoireEventType.DEATH ||
    eventType === GrimoireEventType.EXECUTION ||
    eventType === GrimoireEventType.REVIVE
  );
}

/**
 * The events a saved grimoire implies. With a catalog, a reminder's role is
 * read from its catalog link or icon; without one (or for a reminder the
 * catalog doesn't know) it is guessed from the role names in its icon.
 */
export function generateEventsForMissingGames(
  grimoire: PageLike[],
  catalog?: ReminderCatalog | null,
  options: { script?: string | null } = {}
) {
  activeCatalog = catalog ?? null;
  try {
    return generateEvents(grimoire, options.script);
  } finally {
    activeCatalog = null;
  }
}

function generateEvents(grimoire: PageLike[], script?: string | null) {
  const events: GeneratedEvent[] = [];
  // In Musical Chairs the characters stay in their seats and the players
  // move: the shroud stays with the seat. A player who moved is compared with
  // their new seat on the page before, so moving into a dead seat isn't a
  // death and moving out of one isn't a revive.
  const deathFollowsSeat = isSeatMovingScript(script);

  // Seats by position: some old pages store the same order twice or skip
  // one. Renumbered here only, nothing is saved. Where a page's numbers
  // weren't clean, which seat is which is a guess, so no seat changes are
  // made to or from that page.
  const unclearSeats = grimoire.map((page) => {
    const orders = page.tokens.map((token) => token.order).sort((a, b) => a - b);
    return orders.some((order, seat) => order !== seat);
  });
  for (const page of grimoire) {
    page.tokens
      .slice()
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .forEach((token, seat) => {
        token.order = seat;
      });
  }

  // Every id first: an event's source may sit in a later seat, and needs its
  // id when the event is made. Existing ids are kept (events point at them).
  const missingIds = new Set(
    grimoire.flatMap((page) => page.tokens.filter((token) => !token.grimoire_participant_id))
  );
  const tokenParticipantUpdates = assignParticipantIds(grimoire, { keepExisting: true })
    .filter((token) => missingIds.has(token))
    .map((token) => ({ tokenId: token.id, participantId: token.grimoire_participant_id as string }));

  grimoire.forEach((page, pageIndex) => {
    const orderedTokens = page.tokens.slice().sort((a, b) => a.order - b.order);
    // The token each one continues on the previous page, for the whole page at once.
    const previousMatches =
      pageIndex > 0 ? matchPageTokens(grimoire[pageIndex - 1].tokens, page.tokens) : null;
    // Who changed seat (see seatMoves), unless either page's seat numbers were unclear.
    const movedTokens =
      previousMatches && !unclearSeats[pageIndex] && !unclearSeats[pageIndex - 1]
        ? seatMoves(grimoire[pageIndex - 1].tokens, page.tokens, previousMatches)
        : new Set<TokenLike>();
    // Death/revival rows from the shroud on this page, so death-style
    // reminders can enrich them instead of adding a second row (like the
    // editor's lifecycle merge).
    const lifecycleEvents = new Map<string, GeneratedEvent>();
    // Seat moves by participant, so a seat-change reminder (the Matron's
    // "Swapped") enriches the move instead of adding a second event.
    const seatEvents = new Map<string, GeneratedEvent>();

    for (const token of orderedTokens) {
      const participantId = token.grimoire_participant_id as string;
      const previousToken = previousMatches?.get(token) ?? null;

      const oldRoleId = previousToken?.role_id ?? null;
      const newRoleId = token.role_id ?? null;
      const oldAlignment = previousToken?.alignment ?? null;
      const newAlignment = token.alignment ?? null;
      // Seats are renumbered above, so the same order is the same seat. Also
      // for a seat nobody is linked to (an open chair a named player left).
      const seatBefore =
        deathFollowsSeat && pageIndex > 0 && (movedTokens.has(token) || !previousToken)
          ? grimoire[pageIndex - 1].tokens.find((other) => other.order === token.order)
          : previousToken;
      const wasDeadPreviously = seatBefore?.is_dead ?? false;
      const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
      // A dead Traveller's seat that is emptied when they leave is matched to
      // them by seat, but nobody came back to life.
      const shouldHaveRevival = !token.is_dead && wasDeadPreviously && !isEmptySeat(token);

      if (shouldHaveDeath) {
        const deadReminderSource = detectDeadReminderSource(orderedTokens, token);
        const deathEvent: GeneratedEvent = {
          grimoire_page: pageIndex,
          participant_id: participantId,
          event_type: deadReminderSource
            ? GrimoireEventType.DEATH
            : GrimoireEventType.NOT_RECORDED,
          status_source: null,
          cause: deadReminderSource ? GrimoireEventCause.ABILITY : null,
          by_participant_id: deadReminderSource?.by_participant_id ?? null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: deadReminderSource?.by_role_id ?? null,
          old_role_id: oldRoleId,
          new_role_id: newRoleId,
          old_alignment: oldAlignment,
          new_alignment: newAlignment,
        };
        events.push(deathEvent);
        lifecycleEvents.set(`${participantId}:death`, deathEvent);
      }

      if (shouldHaveRevival) {
        const revivalEvent: GeneratedEvent = {
          grimoire_page: pageIndex,
          participant_id: participantId,
          event_type: GrimoireEventType.REVIVE,
          status_source: null,
          cause: GrimoireEventCause.ABILITY,
          by_participant_id: null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: null,
          old_role_id: oldRoleId,
          new_role_id: newRoleId,
          old_alignment: oldAlignment,
          new_alignment: newAlignment,
        };
        events.push(revivalEvent);
        lifecycleEvents.set(`${participantId}:revival`, revivalEvent);
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
              ? resolveChangedReminderSource(
                  setupReminder,
                  pageIndex,
                  orderedTokens,
                  grimoire
                )
              : null,
            token.role_id
          );
          events.push({
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.ALIGNMENT_CHANGE,
            status_source: null,
            cause: setupSource ? GrimoireEventCause.ABILITY : null,
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
                orderedTokens,
                grimoire
              )
            : null,
          token.role_id,
          previousToken.role_id
        );
        const alignmentChangedSource = enforceSelfScopedChangedSource(
          alignmentChangedReminder
            ? resolveChangedReminderSource(
                alignmentChangedReminder,
                pageIndex,
                orderedTokens,
                grimoire
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
          events.push({
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.ROLE_CHANGE,
            status_source: null,
            cause: changedSource ? GrimoireEventCause.ABILITY : null,
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
          const seatEvent: GeneratedEvent = {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.SEAT_CHANGE,
            status_source: null,
            cause: null,
            by_participant_id: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          };
          events.push(seatEvent);
          seatEvents.set(participantId, seatEvent);
        }

        // An empty seat on the previous page has no side to switch from: a
        // traveller joining later, or a character filled in late, isn't a switch.
        if (
          !!previousToken.role_id &&
          !!token.role_id &&
          token.alignment !== previousToken.alignment
        ) {
          events.push({
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.ALIGNMENT_CHANGE,
            status_source: null,
            cause: alignmentChangedSource ? GrimoireEventCause.ABILITY : null,
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

      // Reminders placed again on a page with the lifetimes applied count as
      // new (see carriedOverReminders).
      const carriedReminders = carriedOverReminders(
        previousToken?.reminders,
        token,
        page,
        grimoire.slice(0, pageIndex) as LifetimePage[],
        activeCatalog
      );
      for (const config of GRIMOIRE_REMINDER_EVENT_CONFIG) {
        const previousCount = previousToken
          ? countReminderByName(carriedReminders, config.reminder)
          : 0;
        const currentCount = countReminderByName(token.reminders, config.reminder);
        if (currentCount <= previousCount) continue;

        const addedMatchingReminders = addedRemindersByName(
          token.reminders,
          carriedReminders,
          config.reminder
        );
        if (addedMatchingReminders.length === 0) continue;

        const remindersWithRoleHint = addedMatchingReminders.filter(
          (reminder) => hasRoleHint(reminder)
        );
        // The icon names who placed it. Also on the rule's own character: the
        // Preacher's "No Ability" on a Mezepheles isn't the Mezepheles' own
        // (the editor checks the same way).
        if (
          config.sourceRoleIds.length > 0 &&
          remindersWithRoleHint.length > 0 &&
          !remindersWithRoleHint.some((reminder) =>
            reminderMatchesAnyRoleHint(reminder, config.sourceRoleIds, orderedTokens)
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
            remindersWithRoleHint,
            orderedTokens
          )
        ) {
          continue;
        }

        let source: { by_participant_id: string | null; by_role_id: string } | null =
          null;
        const previousPageHintReminders =
          pageIndex > 0
            ? previousPageSourceReminders(
                config,
                remindersWithRoleHint,
                orderedTokens
              )
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
              remindersWithRoleHint,
              orderedTokens
            );
          } else {
            source = detectReminderEventSource(
              orderedTokens,
              config.sourceRoleIds,
              remindersWithRoleHint
            );
          }
        }
        if (!source && config.sourceRoleIds.length === 0 && remindersWithRoleHint.length > 0) {
          const hintSources = remindersWithRoleHint
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
          remindersWithRoleHint.length > 0 && config.sourceRoleIds.length > 0
            ? resolveHintSourceRoleIds(
                config.sourceRoleIds,
                remindersWithRoleHint,
                orderedTokens
              )
            : [];
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

        if (isLifecycleEventType(config.eventType)) {
          // Lifecycle events only come from shroud changes. A death-style
          // reminder enriches that row but never creates one on its own.
          const lifecycleEvent = lifecycleEvents.get(
            `${participantId}:${
              config.eventType === GrimoireEventType.REVIVE ? "revival" : "death"
            }`
          );
          if (!lifecycleEvent) continue;

          const sourceVariant = sourceVariants[0];
          if (
            config.eventType === GrimoireEventType.EXECUTION &&
            (lifecycleEvent.event_type === GrimoireEventType.NOT_RECORDED ||
              lifecycleEvent.event_type === GrimoireEventType.DEATH)
          ) {
            lifecycleEvent.event_type = GrimoireEventType.EXECUTION;
          }
          if (
            config.eventType === GrimoireEventType.DEATH &&
            lifecycleEvent.event_type === GrimoireEventType.NOT_RECORDED
          ) {
            lifecycleEvent.event_type = GrimoireEventType.DEATH;
          }
          lifecycleEvent.status_source = config.reminder;
          lifecycleEvent.by_participant_id =
            lifecycleEvent.by_participant_id ??
            sourceVariant?.by_participant_id ??
            null;
          lifecycleEvent.by_role_id =
            lifecycleEvent.by_role_id ?? sourceVariant?.by_role_id ?? null;
          if (
            !lifecycleEvent.cause &&
            lifecycleEvent.event_type !== GrimoireEventType.EXECUTION &&
            lifecycleEvent.by_role_id
          ) {
            lifecycleEvent.cause = GrimoireEventCause.ABILITY;
          }
          continue;
        }

        const seatEvent =
          config.eventType === GrimoireEventType.SEAT_CHANGE
            ? seatEvents.get(participantId)
            : undefined;
        if (seatEvent) {
          const sourceVariant = sourceVariants[0];
          seatEvent.status_source = config.reminder;
          seatEvent.cause = GrimoireEventCause.ABILITY;
          seatEvent.by_participant_id =
            sourceVariant?.by_participant_id ?? seatEvent.by_participant_id;
          seatEvent.by_role_id = sourceVariant?.by_role_id ?? seatEvent.by_role_id;
          continue;
        }

        for (const sourceVariant of sourceVariants) {
          events.push({
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: config.eventType,
            status_source: config.reminder,
            cause: GrimoireEventCause.ABILITY,
            by_participant_id: sourceVariant?.by_participant_id ?? null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: sourceVariant?.by_role_id ?? null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }
      }
    }

  });

  const dedupe = new Set<string>();
  const uniqueEvents = events.filter((event) => {
    const key = [
      event.grimoire_page,
      event.participant_id,
      event.event_type,
      event.status_source ?? "",
      event.cause ?? "",
      event.by_participant_id ?? "",
      event.player_name ?? "",
      event.role_id ?? "",
      event.by_role_id ?? "",
      event.old_role_id ?? "",
      event.new_role_id ?? "",
      event.old_alignment ?? "",
      event.new_alignment ?? "",
    ].join("|");
    if (dedupe.has(key)) return false;
    dedupe.add(key);
    return true;
  });

  return {
    events: uniqueEvents,
    tokenParticipantUpdates,
  };
}
