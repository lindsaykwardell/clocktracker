import { useLocalStorage } from "@vueuse/core";
import { Status } from "~/composables/useFetchStatus";

/**
 * Debug mode for the profile pages (Games, Stats, stat cards): shows which
 * games feed a card or stat and why a game doesn't count, and the games
 * check. Behind the "profile-pages-debug" feature flag, and only on the
 * user's own pages (/@username/...) unless they're an admin.
 * Remembered per browser.
 */
export function useStatsDebug() {
  const featureFlags = useFeatureFlags();
  const me = useMe();
  const route = useRoute();
  const stored = useLocalStorage("statsDebug", false);

  const isAdmin = computed(
    () => me.value.status === Status.SUCCESS && !!me.value.data.is_admin
  );

  const isOwnPage = computed(() => {
    if (me.value.status !== Status.SUCCESS) return false;
    const pageUser = route.params.username;
    return (
      typeof pageUser === "string" &&
      pageUser.toLowerCase() === me.value.data.username.toLowerCase()
    );
  });

  const canDebug = computed(
    () => featureFlags.isEnabled("profile-pages-debug") && (isAdmin.value || isOwnPage.value)
  );

  const enabled = computed({
    get: () => canDebug.value && stored.value,
    set: (value: boolean) => {
      stored.value = value;
    },
  });

  return { canDebug, enabled };
}
