import type { JwtPayload } from "@supabase/supabase-js";

/**
 * Server-side user type derived from JWT claims.
 *
 * In @nuxtjs/supabase v2, serverSupabaseUser() returns JwtPayload instead of
 * the full User object. The auth middleware maps `sub` to `id` for backwards
 * compatibility with existing route handlers.
 */
export type SupabaseUser = JwtPayload & { id: string };
