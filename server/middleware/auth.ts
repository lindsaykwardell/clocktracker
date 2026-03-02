import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    const claims = await serverSupabaseUser(event);
    if (claims) {
      event.context.user = { ...claims, id: claims.sub };
    }
  } catch {
    // do nothing
  }
});
