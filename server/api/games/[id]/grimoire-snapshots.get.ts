import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { user_id: true },
  });

  if (!game || game.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return prisma.grimoireSnapshot.findMany({
    where: { game_id: gameId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      created_at: true,
      snapshot: true,
    },
  });
});
