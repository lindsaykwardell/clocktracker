import { User } from "@supabase/supabase-js";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  return getFeatureFlags(me);
});
