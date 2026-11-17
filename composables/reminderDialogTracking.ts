import type { InjectionKey, Ref } from "vue";

/**
 * Whether the reminder dialog shows the tracking reminders. The game editor
 * provides one per game, so turning it off stays off for every reminder dialog
 * in that game and a new game starts with it on again.
 */
export const SHOW_TRACKING_REMINDERS_KEY: InjectionKey<Ref<boolean>> = Symbol(
  "showTrackingReminders"
);
