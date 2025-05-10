export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  if (user.value) {
    try {
      const settings = await $fetch("/api/settings");
    } catch (error) {
      console.error(error);
      return navigateTo(`/`);
    }
    return;
  }
});
