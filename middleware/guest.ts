export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  // If user is logged in, redirect them away from guest-only pages (like login)
  if (user.value) {
    return navigateTo("/");
  }
  // If no user, allow access to guest pages
});
