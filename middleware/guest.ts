export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  if (user.value) {
    const settings = await useFetch("/api/settings");

    if (settings.error.value || !settings.data.value) {
      console.error(settings.error.value);
      return;
    }

    return navigateTo(`/dashboard`);
  }
});
