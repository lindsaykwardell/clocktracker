export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!to.path.startsWith("/forum")) return;

  const featureFlags = useFeatureFlags();

  // Ensure feature flags are loaded before checking.
  // On page refresh, middleware runs before app.vue's init() call,
  // so the store may be empty.
  if (featureFlags.flags.size === 0) {
    await featureFlags.init();
  }

  if (!featureFlags.isEnabled("forum", to.query)) {
    return navigateTo("/");
  }
});
