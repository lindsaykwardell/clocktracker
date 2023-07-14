export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo("/");
  }

  const settings = await useFetch("/api/settings");

  if (!settings.data.value) {
    return navigateTo("/");
  }

  if (!settings.data.value.is_admin) {
    return navigateTo("/");
  }
});
