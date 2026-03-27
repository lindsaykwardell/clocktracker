import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import getLocation from "../utils/getLocation";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  let { search } = getQuery(handler) as {
    search: string;
  };

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  return getLocation.byName(search);
});
