export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const featureFlags = useFeatureFlags();

  if (user.value) {
    const settings = await useFetch("/api/settings");

    if (settings.error.value || !settings.data.value) {
      console.error(settings.error.value);
      return;
    }

    if (featureFlags.isEnabled("dashboard")) {
      return navigateTo(`/dashboard`);
    }

    return navigateTo(`/@${settings.data.value.username}`);
  }
});
