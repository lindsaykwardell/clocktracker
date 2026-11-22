import { useLocalStorage } from "@vueuse/core";
import { Status } from "~/composables/useFetchStatus";

/**
 * Debug mode for the stats pages: shows which games feed a card or stat and
 * why a game doesn't count. Admins only for now; remembered per browser.
 */
export function useStatsDebug() {
  const me = useMe();
  const stored = useLocalStorage("statsDebug", false);

  const canDebug = computed(
    () => me.value.status === Status.SUCCESS && !!me.value.data.is_admin
  );

  const enabled = computed({
    get: () => canDebug.value && stored.value,
    set: (value: boolean) => {
      stored.value = value;
    },
  });

  return { canDebug, enabled };
}
