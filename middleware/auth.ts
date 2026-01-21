export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  
  // Wait for Supabase to initialize the user state
  // This is important for client-side navigation
  if (!user.value && process.client) {
    // Try to get the session explicitly
    const { data: { session } } = await supabase.auth.getSession();
    
    // If we have a session but no user yet, wait a bit more
    if (session && !user.value) {
      await new Promise(resolve => setTimeout(resolve, 200));
    } else if (!session) {
      // No session at all, redirect immediately
      return navigateTo("/");
    }
  }

  if (!user.value) {
    return navigateTo("/");
  }
});
