/**
 * Compatibility wrapper for useSupabaseUser().
 *
 * In @nuxtjs/supabase v2, useSupabaseUser() returns JWT claims (JwtPayload)
 * instead of the full User object. The user ID is now in `.sub` instead of `.id`.
 *
 * This composable provides a stable `{ id }` interface so the rest of the codebase
 * doesn't need to know about the underlying JWT structure.
 */
export function useUser() {
  const claims = useSupabaseUser();
  return computed(() => {
    if (!claims.value) return null;
    return { ...claims.value, id: claims.value.sub };
  });
}
