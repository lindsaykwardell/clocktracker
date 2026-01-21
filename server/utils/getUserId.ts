import type { User } from "@supabase/supabase-js";

/**
 * Gets the user ID from a Supabase user object.
 * On the server side, the JWT payload uses 'sub' as the user ID.
 * On the client side, the User object may have 'id'.
 * This function handles both cases.
 */
export function getUserId(user: User | null | undefined): string | null {
  if (!user) return null;
  
  // JWT payload from server has 'sub', client User object has 'id'
  return (user as any).sub || user.id || null;
}
