import {
  catalogEntryForRole,
  reminderRoleId,
  type CatalogReminder,
  type ReminderCatalog,
} from "~/shared/reminderCatalog";
import { normalizeRuleReminderName, reminderLifetime } from "~/shared/reminderRules";

export type LifetimeReminder = CatalogReminder & {
  reminder: string;
  is_custom?: boolean | null;
  type?: string | null;
};

export type LifetimeToken<R extends LifetimeReminder = LifetimeReminder> = {
  reminders: R[];
  grimoire_participant_id?: string | null;
  order?: number | null;
};

/** An earlier page, for the lifetimes that last two phases. */
export type LifetimePage = {
  page_type?: string | null;
  tokens?: LifetimeToken[] | null;
};

export type ReminderLifetimeResult = {
  /** Reminders taken off the page. */
  removed: number;
  /** Countdown reminders moved one step ("Drunk 3" to "Drunk 2"). */
  countedDown: number;
  /** Count-up reminders moved one step ("Night 1" to "Night 2"). */
  countedUp: number;
  /** Puts the reminders back as they were. */
  undo: () => void;
};

const COUNTDOWN = /^(.*?)(\d+)\s*$/;

/** The same seat on an earlier page: by participant, else by order. */
function sameToken(page: LifetimePage | null, token: LifetimeToken, index: number) {
  const tokens = page?.tokens ?? [];
  if (token.grimoire_participant_id) {
    return tokens.find((t) => t.grimoire_participant_id === token.grimoire_participant_id) ?? null;
  }
  if (token.order !== null && token.order !== undefined) {
    return tokens.find((t) => t.order === token.order) ?? null;
  }
  return tokens[index] ?? null;
}

/**
 * Applies the reminder lifetimes (see shared/reminderRules.ts) to the tokens
 * of a new page that starts the next phase. Reminders without a role (made up,
 * or with an unknown icon) and reminders without a rule stay.
 *
 * `previousPages` are the pages before the new one. The two-phase lifetimes
 * end a reminder only if the last page of the new page's type already had it
 * on the same seat; without them, those reminders stay.
 */
export function applyReminderLifetimes<R extends LifetimeReminder>(
  tokens: LifetimeToken<R>[],
  newPageType: "DAY" | "NIGHT",
  catalog: ReminderCatalog,
  previousPages: LifetimePage[] = []
): ReminderLifetimeResult {
  const previous = new Map<LifetimeToken<R>, R[]>();
  let removed = 0;
  let countedDown = 0;
  let countedUp = 0;

  const lastSameType =
    [...previousPages].reverse().find((page) => page.page_type === newPageType) ?? null;
  const hadOnLastSameType = (
    token: LifetimeToken<R>,
    index: number,
    roleId: string,
    reminder: R
  ) => {
    const earlier = sameToken(lastSameType, token, index);
    const name = normalizeRuleReminderName(reminder.reminder);
    return (earlier?.reminders ?? []).some(
      (r) =>
        normalizeRuleReminderName(r.reminder) === name &&
        r.is_custom !== true &&
        r.type !== "CUSTOM" &&
        reminderRoleId(catalog, r) === roleId
    );
  };

  tokens.forEach((token, index) => {
    const kept: R[] = [];
    let changed = false;

    for (const reminder of token.reminders ?? []) {
      const roleId =
        reminder.is_custom === true || reminder.type === "CUSTOM"
          ? null
          : reminderRoleId(catalog, reminder);
      const lifetime = roleId ? reminderLifetime(roleId, reminder.reminder) : "stays";

      const ends =
        lifetime === "next_phase" ||
        (lifetime === "until_day" && newPageType === "DAY") ||
        (lifetime === "until_night" && newPageType === "NIGHT") ||
        (!!roleId &&
          ((lifetime === "until_second_night" && newPageType === "NIGHT") ||
            (lifetime === "until_second_day" && newPageType === "DAY")) &&
          hadOnLastSameType(token, index, roleId, reminder));
      if (ends) {
        removed += 1;
        changed = true;
        continue;
      }

      if (lifetime === "countdown" && newPageType === "NIGHT" && roleId) {
        const match = COUNTDOWN.exec(reminder.reminder);
        if (match) {
          const left = Number(match[2]) - 1;
          if (left <= 0) {
            removed += 1;
            changed = true;
            continue;
          }
          const text = `${match[1]}${left}`;
          const entry = catalogEntryForRole(catalog, roleId, text);
          kept.push({ ...reminder, reminder: text, role_reminder_id: entry?.id ?? null });
          countedDown += 1;
          changed = true;
          continue;
        }
      }

      // "Night 1" moves on each new Night, "Day 1" each new Day, as far as the
      // role has reminders ("Night 3" is the Xaan's last).
      if (lifetime === "count_up" && roleId) {
        const match = COUNTDOWN.exec(reminder.reminder);
        const countsOn = match && /^\s*day\b/i.test(match[1]) ? "DAY" : "NIGHT";
        if (match && countsOn === newPageType) {
          const text = `${match[1]}${Number(match[2]) + 1}`;
          const entry = catalogEntryForRole(catalog, roleId, text);
          if (entry) {
            kept.push({ ...reminder, reminder: entry.reminder, role_reminder_id: entry.id });
            countedUp += 1;
            changed = true;
            continue;
          }
        }
      }

      kept.push(reminder);
    }

    if (changed) {
      previous.set(token, token.reminders);
      token.reminders = kept;
    }
  });

  return {
    removed,
    countedDown,
    countedUp,
    undo: () => {
      for (const [token, reminders] of previous) {
        token.reminders = reminders;
      }
    },
  };
}

/** A page as the event engines see it. */
export type LifetimeMarkedPage = {
  page_type?: string | null;
  lifetimes_applied?: boolean | null;
};

/**
 * The previous page's reminders that a token carried over to this page. On a
 * page "Add page" made with the lifetimes applied (`lifetimes_applied`), the
 * reminders whose lifetime ended there were removed, so one that is on the
 * page anyway was placed again and counts as new (the Poisoner choosing the
 * same player two nights in a row). On any other page (legacy games, untyped
 * or cloned pages, lifetimes off) every previous reminder counts as carried
 * over, as before.
 */
export function carriedOverReminders<R extends LifetimeReminder>(
  previousReminders: R[] | undefined,
  token: { grimoire_participant_id?: string | null; order?: number | null },
  page: LifetimeMarkedPage,
  previousPages: LifetimePage[],
  catalog: ReminderCatalog | null | undefined
): R[] | undefined {
  if (!previousReminders || !page.lifetimes_applied || !catalog) return previousReminders;
  if (page.page_type !== "DAY" && page.page_type !== "NIGHT") return previousReminders;

  const copy: LifetimeToken<R> = {
    reminders: [...previousReminders],
    grimoire_participant_id: token.grimoire_participant_id ?? null,
    order: token.order ?? null,
  };
  applyReminderLifetimes([copy], page.page_type, catalog, previousPages);
  return copy.reminders;
}
