import { useLocalStorage } from "@vueuse/core";

/**
 * The grimoire options above the grimoire in the game editor, remembered per
 * browser like Record Grimoire.
 * - dayNight: new grimoires start on a Night page instead of an untyped one.
 * - autoReminders: "Add page" applies the reminder lifetimes.
 * - showTracking: the reminder dialogs list the tracking reminders.
 */
export function useGrimoirePreferences() {
  return {
    dayNight: useLocalStorage("grimoireDayNight", true),
    autoReminders: useLocalStorage("grimoireAutoReminders", true),
    showTracking: useLocalStorage("grimoireShowTracking", true),
  };
}

/** The first page of a new grimoire, following the Day/Night option. */
export function firstGrimoirePage(dayNight: boolean) {
  return dayNight
    ? { title: "Night 1", page_type: "NIGHT" as const, lifetimes_applied: false }
    : { title: "Page 1", page_type: "NONE" as const, lifetimes_applied: false };
}
