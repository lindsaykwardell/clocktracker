import type { InjectionKey, Ref } from "vue";

/**
 * Whether the reminder dialogs show the tracking reminders. The game editor
 * provides the "Show tracking reminders" grimoire option (remembered per
 * browser, see useGrimoirePreferences).
 */
export const SHOW_TRACKING_REMINDERS_KEY: InjectionKey<Ref<boolean>> = Symbol(
  "showTrackingReminders"
);
