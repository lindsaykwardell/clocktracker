/**
 * Which role a reminder on a token belongs to, looked up in the reminder
 * catalog (the roles and their RoleReminder rows) instead of guessed from the
 * reminder's icon.
 *
 * A placed reminder keeps `role_reminder_id`, the catalog row it was picked
 * from. Reminders saved before that link existed only have their icon
 * (`token_url`), which is the icon of the role they came from.
 */

export type ReminderCatalogRole = {
  id: string;
  token_url?: string | null;
  custom_role?: boolean | null;
  reminders: { id: number; reminder: string }[];
};

export type ReminderCatalogEntry = {
  id: number;
  roleId: string;
  reminder: string;
};

export type ReminderCatalog = {
  entryById: Map<number, ReminderCatalogEntry>;
  /** Role by icon; official roles win when a custom role reuses an icon. */
  roleIdByTokenUrl: Map<string, string>;
  /** Catalog row by role id and reminder text. */
  entryByRoleAndText: Map<string, ReminderCatalogEntry>;
};

export type CatalogReminder = {
  reminder?: string | null;
  token_url?: string | null;
  role_reminder_id?: number | null;
};

function roleAndTextKey(roleId: string, reminder: string) {
  return `${roleId}\u0000${reminder}`;
}

export function buildReminderCatalog(roles: ReminderCatalogRole[]): ReminderCatalog {
  const catalog: ReminderCatalog = {
    entryById: new Map(),
    roleIdByTokenUrl: new Map(),
    entryByRoleAndText: new Map(),
  };
  const ordered = roles.toSorted(
    (a, b) =>
      Number(!!a.custom_role) - Number(!!b.custom_role) || a.id.localeCompare(b.id)
  );
  for (const role of ordered) {
    if (role.token_url && !catalog.roleIdByTokenUrl.has(role.token_url)) {
      catalog.roleIdByTokenUrl.set(role.token_url, role.id);
    }
    for (const row of role.reminders) {
      const entry = { id: row.id, roleId: role.id, reminder: row.reminder };
      catalog.entryById.set(row.id, entry);
      const key = roleAndTextKey(role.id, row.reminder);
      if (!catalog.entryByRoleAndText.has(key)) {
        catalog.entryByRoleAndText.set(key, entry);
      }
    }
  }
  return catalog;
}

/** The catalog row a role has for this reminder text, if any. */
export function catalogEntryForRole(
  catalog: ReminderCatalog,
  roleId: string,
  reminder: string
) {
  return catalog.entryByRoleAndText.get(roleAndTextKey(roleId, reminder)) ?? null;
}

/**
 * The catalog row of a placed reminder: its link, or else the row its role
 * (known from the icon) has with the same text. Null for a made-up reminder or
 * one whose role isn't known.
 */
export function catalogEntryForReminder(
  catalog: ReminderCatalog | null | undefined,
  reminder: CatalogReminder
): ReminderCatalogEntry | null {
  if (!catalog) return null;
  if (typeof reminder.role_reminder_id === "number") {
    const linked = catalog.entryById.get(reminder.role_reminder_id);
    if (linked) return linked;
  }
  const roleId = reminder.token_url
    ? catalog.roleIdByTokenUrl.get(reminder.token_url)
    : undefined;
  if (!roleId || !reminder.reminder) return null;
  return catalogEntryForRole(catalog, roleId, reminder.reminder);
}

/**
 * The role a placed reminder came from: from its catalog link, or else from
 * its icon. Null when neither is known (a made-up reminder, no icon, or an
 * icon that isn't a role's).
 */
export function reminderRoleId(
  catalog: ReminderCatalog | null | undefined,
  reminder: CatalogReminder
): string | null {
  if (!catalog) return null;
  if (typeof reminder.role_reminder_id === "number") {
    const linked = catalog.entryById.get(reminder.role_reminder_id);
    if (linked) return linked.roleId;
  }
  if (!reminder.token_url) return null;
  return catalog.roleIdByTokenUrl.get(reminder.token_url) ?? null;
}
