export default defineNuxtRouteMiddleware(async (to, from) => {
  const featureFlags = useFeatureFlags();

  if (
    featureFlags.isEnabled("maintenance", to.query) &&
    to.path !== "/maintenance"
  ) {
    return navigateTo(`/maintenance`);
  }
});
