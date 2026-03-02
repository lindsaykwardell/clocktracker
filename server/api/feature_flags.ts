import type { SupabaseUser as User } from "~/server/utils/supabaseUser";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  return getFeatureFlags(me);
});
