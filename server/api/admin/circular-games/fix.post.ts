import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  if (!(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    gameAId: string;
    gameBId: string;
    action: "unlink_a" | "unlink_b" | "unlink_both";
  }>(handler);

  if (!body.gameAId || !body.gameBId || !body.action) {
    throw createError({ status: 400, statusMessage: "Missing required fields" });
  }

  if (!["unlink_a", "unlink_b", "unlink_both"].includes(body.action)) {
    throw createError({ status: 400, statusMessage: "Invalid action" });
  }

  // Verify the circular reference still exists
  const [gameA, gameB] = await Promise.all([
    prisma.game.findUnique({ where: { id: body.gameAId }, select: { id: true, parent_game_id: true } }),
    prisma.game.findUnique({ where: { id: body.gameBId }, select: { id: true, parent_game_id: true } }),
  ]);

  if (!gameA || !gameB) {
    throw createError({ status: 404, statusMessage: "One or both games not found" });
  }

  if (gameA.parent_game_id !== gameB.id || gameB.parent_game_id !== gameA.id) {
    throw createError({ status: 409, statusMessage: "Circular reference no longer exists" });
  }

  // Fix the circular reference
  if (body.action === "unlink_a") {
    await prisma.game.update({
      where: { id: body.gameAId },
      data: { parent_game_id: null },
    });
  } else if (body.action === "unlink_b") {
    await prisma.game.update({
      where: { id: body.gameBId },
      data: { parent_game_id: null },
    });
  } else {
    await prisma.$transaction([
      prisma.game.update({
        where: { id: body.gameAId },
        data: { parent_game_id: null },
      }),
      prisma.game.update({
        where: { id: body.gameBId },
        data: { parent_game_id: null },
      }),
    ]);
  }

  return { success: true };
});
