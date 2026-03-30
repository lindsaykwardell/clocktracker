import {
  GrimoireEventCause,
  GrimoireEventType,
} from "~/server/generated/prisma/client";
import {
  createParticipantId,
  findMatchingTokenOnPreviousPage,
} from "~/composables/grimoireParticipantMatching";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/server/utils/grimoireReminderEventConfig";

type ReminderLike = {
  reminder: string;
  token_url: string;
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
  role?: { name: string } | null;
};

type PageLike = {
  id: number;
  tokens: TokenLike[];
};

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

function normalizeReminderName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
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
  roleIds: string[],
  pageTokens: TokenLike[]
) {
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

function detectDeadReminderSource(pageTokens: TokenLike[], token: TokenLike) {
  const deadReminder = token.reminders.find(
    (reminder) => reminder.reminder.trim().toLowerCase() === "dead"
  );
  if (!deadReminder?.token_url) return null;

  const reminderUrlHint = normalizeReminderRoleHint(deadReminder.token_url);
  if (!reminderUrlHint) return null;

  const matchingCharacters = pageTokens.filter((candidate) => {
    if (!candidate.role_id) return false;

    const roleNameHint = normalizeReminderRoleHint(candidate.role?.name);
    const roleIdHint = normalizeReminderRoleHint(candidate.role_id);

    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });

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
  const reminderUrlHint = normalizeReminderRoleHint(reminder.token_url);
  if (!reminderUrlHint) return null;

  const matchingCharacters = sourceTokens.filter((candidate) => {
    if (!candidate.role_id) return false;

    const roleNameHint = normalizeReminderRoleHint(candidate.role?.name);
    const roleIdHint = normalizeReminderRoleHint(candidate.role_id);

    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });

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

export function generateEventsForMissingGames(grimoire: PageLike[]) {
  const events: GeneratedEvent[] = [];
  const tokenParticipantUpdates: { tokenId: number; participantId: string }[] = [];

  grimoire.forEach((page, pageIndex) => {
    const orderedTokens = page.tokens.slice().sort((a, b) => a.order - b.order);
    const usedPreviousOrders = new Set<number>();

    for (const token of orderedTokens) {
      if (!token.grimoire_participant_id) {
        const previousToken =
          pageIndex > 0
            ? findMatchingTokenOnPreviousPage(
                grimoire,
                pageIndex,
                token,
                usedPreviousOrders
              )
            : null;
        token.grimoire_participant_id =
          previousToken?.grimoire_participant_id || createParticipantId();
        tokenParticipantUpdates.push({
          tokenId: token.id,
          participantId: token.grimoire_participant_id,
        });
      }

      const participantId = token.grimoire_participant_id;
      const previousToken =
        pageIndex > 0
          ? findMatchingTokenOnPreviousPage(
              grimoire,
              pageIndex,
              token,
              usedPreviousOrders,
              !token.is_dead
            )
          : null;

      const oldRoleId = previousToken?.role_id ?? null;
      const newRoleId = token.role_id ?? null;
      const oldAlignment = previousToken?.alignment ?? null;
      const newAlignment = token.alignment ?? null;
      const wasDeadPreviously = previousToken?.is_dead ?? false;
      const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
      const shouldHaveRevival = !token.is_dead && wasDeadPreviously;

      if (shouldHaveDeath) {
        const deadReminderSource = detectDeadReminderSource(orderedTokens, token);
        events.push({
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
        });
      }

      if (shouldHaveRevival) {
        events.push({
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
        });
      }

      if (previousToken) {
        const changedReminder =
          findReminderByNames(token.reminders, ["Changed"]) ??
          findReminderByNames(previousToken.reminders, ["Changed"]);
        const alignmentChangedReminder =
          findReminderByNames(token.reminders, ["Changed", "Turns Evil"]) ??
          findReminderByNames(previousToken.reminders, ["Changed", "Turns Evil"]);
        const changedSource = changedReminder
          ? detectSourceFromReminderHint(
              pageIndex > 0 ? grimoire[pageIndex - 1].tokens : orderedTokens,
              changedReminder
            )
          : null;
        const alignmentChangedSource = alignmentChangedReminder
          ? detectSourceFromReminderHint(
              pageIndex > 0 ? grimoire[pageIndex - 1].tokens : orderedTokens,
              alignmentChangedReminder
            )
          : null;

        const roleChanged =
          !!token.role_id &&
          !!previousToken.role_id &&
          (token.role_id !== previousToken.role_id ||
            token.related_role_id !== previousToken.related_role_id);
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

        if (token.order !== previousToken.order) {
          events.push({
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
          });
        }

        if (token.alignment !== previousToken.alignment) {
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

      for (const config of GRIMOIRE_REMINDER_EVENT_CONFIG) {
        const previousCount = previousToken
          ? countReminderByName(previousToken.reminders, config.reminder)
          : 0;
        const currentCount = countReminderByName(token.reminders, config.reminder);
        if (currentCount <= previousCount) continue;

        const addedMatchingReminders = addedRemindersByName(
          token.reminders,
          previousToken?.reminders,
          config.reminder
        );
        if (addedMatchingReminders.length === 0) continue;

        const remindersWithRoleHint = addedMatchingReminders.filter(
          (reminder) => !!normalizeReminderRoleHint(reminder.token_url)
        );
        const isSelfSourcedReminder =
          !!token.role_id && config.sourceRoleIds.includes(token.role_id);
        if (
          config.sourceRoleIds.length > 0 &&
          remindersWithRoleHint.length > 0 &&
          !isSelfSourcedReminder &&
          !remindersWithRoleHint.some((reminder) =>
            reminderMatchesAnyRoleHint(reminder, config.sourceRoleIds, orderedTokens)
          )
        ) {
          continue;
        }

        if (
          config.targetRoleIds?.length &&
          (!token.role_id || !config.targetRoleIds.includes(token.role_id))
        ) {
          continue;
        }

        let source = detectReminderEventSource(
          orderedTokens,
          config.sourceRoleIds,
          remindersWithRoleHint
        );
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

        events.push({
          grimoire_page: pageIndex,
          participant_id: participantId,
          event_type: config.eventType,
          status_source: config.reminder,
          cause: GrimoireEventCause.ABILITY,
          by_participant_id: source?.by_participant_id ?? null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: source?.by_role_id ?? null,
          old_role_id: oldRoleId,
          new_role_id: newRoleId,
          old_alignment: oldAlignment,
          new_alignment: newAlignment,
        });
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
