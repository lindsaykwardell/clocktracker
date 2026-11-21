import type { GrimoireEventType } from "~/server/generated/prisma/client";
import {
  REMINDER_EVENT_CONFIG,
  type ReminderEventConfig,
} from "~/shared/reminderRules";

export type {
  ReminderSourceMode as GrimoireReminderSourceMode,
  ReminderTargetScope as GrimoireReminderTargetScope,
} from "~/shared/reminderRules";

export type GrimoireReminderEventConfig = Omit<ReminderEventConfig, "eventType"> & {
  eventType: GrimoireEventType;
};

/**
 * The reminder event rules (see shared/reminderRules.ts), typed with the
 * database's event type. Its values are the same strings.
 */
export const GRIMOIRE_REMINDER_EVENT_CONFIG =
  REMINDER_EVENT_CONFIG as unknown as GrimoireReminderEventConfig[];
