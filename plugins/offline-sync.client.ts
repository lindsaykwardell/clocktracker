export default defineNuxtPlugin(() => {
  const { flushQueue, refreshCount, hydrateQueuedGames } = useOfflineSync();
  const user = useUser();

  // Load initial count and inject queued games into the store
  refreshCount();
  hydrateQueuedGames();


  // Flush when coming back online
  window.addEventListener("online", () => {
    if (user.value) {
      flushQueue();
    }
  });

  // Also try flushing on app resume (Capacitor)
  const config = useRuntimeConfig();
  if (config.public.isCapacitorBuild) {
    import("@capacitor/app").then(({ App }) => {
      App.addListener("resume", () => {
        if (user.value) {
          flushQueue();
        }
      });
    });
  }

  // Flush on login if there are pending games
  watch(
    () => user.value?.id,
    (id) => {
      if (id) {
        flushQueue();
      }
    }
  );
});
