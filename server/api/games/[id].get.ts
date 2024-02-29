import type { User } from "@supabase/supabase-js";
import { fetchGame } from "~/server/utils/fetchGames";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const gameId = handler.context.params?.id;

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  return fetchGame(gameId, me);
});
