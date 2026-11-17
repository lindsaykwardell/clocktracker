export type ReminderTypeName =
  | "OFFICIAL"
  | "TRACKING"
  | "IMPORTED"
  | "LEGACY"
  | "CUSTOM";

/**
 * A reminder on a game token, as the client holds it. The type is not stored
 * on the reminder itself: it comes from the linked catalog entry
 * (`role_reminder`), or from `type`, which the editor keeps for reminders it
 * just added or loaded.
 */
export type GameReminder = {
  id?: number;
  reminder: string;
  token_url: string;
  role_reminder_id?: number | null;
  is_custom?: boolean | null;
  role_reminder?: { type: ReminderTypeName } | null;
  type?: ReminderTypeName | null;
};

/**
 * The type a reminder should be shown as. Null means a reminder saved before
 * linking existed that is not linked yet; it is shown like an official one,
 * as it always was.
 */
export function reminderDisplayType(reminder: {
  type?: ReminderTypeName | null;
  role_reminder?: { type: ReminderTypeName } | null;
  is_custom?: boolean | null;
}): ReminderTypeName | null {
  if (reminder.type) return reminder.type;
  if (reminder.role_reminder?.type) return reminder.role_reminder.type;
  if (reminder.is_custom) return "CUSTOM";
  return null;
}

/** Copies a reminder for the editor, keeping its catalog link and type. */
export function toEditorReminder(reminder: GameReminder): GameReminder {
  return {
    reminder: reminder.reminder,
    token_url: reminder.token_url,
    role_reminder_id: reminder.role_reminder_id ?? null,
    is_custom: reminder.is_custom ?? false,
    type: reminderDisplayType(reminder),
  };
}
