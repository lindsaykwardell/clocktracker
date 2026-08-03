const ONLINE_ONLY_PREFIXES = ["/roles/", "/scripts/", "/search", "/friends", "/settings", "/admin", "/community/create"];
const ONLINE_ONLY_EXACT = ["/forum"];

export default defineNuxtRouteMiddleware((to, from) => {
  if (typeof navigator === "undefined") return;
  if (navigator.onLine) return;

  const path = to.path;
  if (ONLINE_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
      ONLINE_ONLY_EXACT.some((exact) => path === exact)) {
    if (import.meta.client) {
      useOfflineSync().notifyOfflineBlocked(
        "That page isn't available offline. It'll work again once you're back online."
      );
    }
    return abortNavigation();
  }
});
