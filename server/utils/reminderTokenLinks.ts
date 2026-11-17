import type { Prisma, PrismaClient } from "~/server/generated/prisma/client";

/**
 * Links reminders on game tokens (ReminderToken) to the reminder catalog
 * (RoleReminder), which is where a reminder's type (official, tracking, ...)
 * lives. See the ReminderToken model for what the columns mean.
 */

type Db = PrismaClient | Prisma.TransactionClient;

/** A reminder as the editor, a snapshot or an import sends it. */
export type IncomingReminder = {
  reminder?: string | null;
  token_url?: string | null;
  role_reminder_id?: number | null;
  is_custom?: boolean | null;
  /** Display-only type the editor keeps; "CUSTOM" marks a made-up reminder. */
  type?: string | null;
};

export type ReminderLink = {
  role_reminder_id: number | null;
  is_custom: boolean;
};

/** Reads reminders together with the type of the catalog entry they link to. */
export const reminderTokenWithType = {
  include: { role_reminder: { select: { type: true } } },
} as const;

/** Catalog lookup by icon + reminder text, the way the editor shows reminders. */
export type ReminderCatalogIndex = Map<string, number>;

function catalogKey(tokenUrl: string, reminder: string) {
  return `${tokenUrl}\u0000${reminder}`;
}

/**
 * Builds the icon + text lookup. Roles must be ordered by preference (official
 * roles first, then by id), so the first match wins when several roles share
 * an icon.
 */
export function buildReminderCatalogIndex(
  roles: {
    token_url: string;
    reminders: { id: number; reminder: string }[];
  }[]
): ReminderCatalogIndex {
  const index: ReminderCatalogIndex = new Map();
  for (const role of roles) {
    if (!role.token_url) continue;
    const reminders = role.reminders.toSorted((a, b) => a.id - b.id);
    for (const reminder of reminders) {
      const key = catalogKey(role.token_url, reminder.reminder);
      if (!index.has(key)) index.set(key, reminder.id);
    }
  }
  return index;
}

function needsCatalogMatch(reminder: IncomingReminder) {
  return !(reminder.is_custom === true || reminder.type === "CUSTOM");
}

/**
 * Decides the link for one reminder:
 * 1. A catalog id that exists is kept.
 * 2. A reminder marked custom stays custom.
 * 3. Anything else (older data without a link) is matched on the reminder's
 *    icon and text, the same way the background link job does it. No match
 *    means it was made up, so it becomes custom.
 */
export function decideReminderLink(
  reminder: IncomingReminder,
  validIds: ReadonlySet<number>,
  catalog: ReminderCatalogIndex
): ReminderLink {
  const id = reminder.role_reminder_id;
  if (typeof id === "number" && validIds.has(id)) {
    return { role_reminder_id: id, is_custom: false };
  }
  if (!needsCatalogMatch(reminder)) {
    return { role_reminder_id: null, is_custom: true };
  }
  const matched = catalog.get(
    catalogKey(reminder.token_url ?? "", reminder.reminder ?? "")
  );
  return matched === undefined
    ? { role_reminder_id: null, is_custom: true }
    : { role_reminder_id: matched, is_custom: false };
}

/** Loads the catalog entries needed to match these icon + text pairs. */
export async function loadReminderCatalogIndex(
  db: Db,
  reminders: { token_url?: string | null; reminder?: string | null }[]
): Promise<ReminderCatalogIndex> {
  const urls = new Set<string>();
  const texts = new Set<string>();
  for (const reminder of reminders) {
    if (!reminder.token_url || !reminder.reminder) continue;
    urls.add(reminder.token_url);
    texts.add(reminder.reminder);
  }
  if (urls.size === 0) return new Map();

  const roles = await db.role.findMany({
    where: { token_url: { in: [...urls] } },
    orderBy: [{ custom_role: "asc" }, { id: "asc" }],
    select: {
      token_url: true,
      reminders: {
        where: { reminder: { in: [...texts] } },
        select: { id: true, reminder: true },
      },
    },
  });
  return buildReminderCatalogIndex(roles);
}

/**
 * Prepares links for every reminder that is about to be saved, with two
 * queries in total. Returns a function that gives the link for one reminder.
 */
export async function prepareReminderLinks(
  db: Db,
  reminders: IncomingReminder[]
): Promise<(reminder: IncomingReminder) => ReminderLink> {
  const requestedIds = new Set<number>();
  for (const reminder of reminders) {
    const id = reminder.role_reminder_id;
    if (typeof id === "number" && Number.isInteger(id) && id > 0) {
      requestedIds.add(id);
    }
  }

  const validIds = new Set<number>();
  if (requestedIds.size > 0) {
    const rows = await db.roleReminder.findMany({
      where: { id: { in: [...requestedIds] } },
      select: { id: true },
    });
    for (const row of rows) validIds.add(row.id);
  }

  const toMatch = reminders.filter((reminder) => {
    const id = reminder.role_reminder_id;
    if (typeof id === "number" && validIds.has(id)) return false;
    return needsCatalogMatch(reminder);
  });
  const catalog = await loadReminderCatalogIndex(db, toMatch);

  return (reminder) => decideReminderLink(reminder, validIds, catalog);
}

/** All reminders on all tokens of a grimoire payload, for prepareReminderLinks. */
export function remindersInGrimoire(
  grimoire: { tokens?: { reminders?: IncomingReminder[] | null }[] | null }[]
): IncomingReminder[] {
  return grimoire.flatMap((page) =>
    (page.tokens ?? []).flatMap((token) => token.reminders ?? [])
  );
}
