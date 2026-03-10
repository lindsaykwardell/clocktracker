export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!to.path.startsWith("/forum")) return;

  const featureFlags = useFeatureFlags();

  if (!featureFlags.isEnabled("forum", to.query)) {
    return navigateTo("/");
  }
});
