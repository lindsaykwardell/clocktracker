import type { User } from "@supabase/supabase-js";
import { PrismaClient, game } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<game | null>(handler);

  if (!user) {
    return {
      status: 401,
      body: {
        message: "Unauthorized",
      },
    };
  }

  if (!body) {
    return {
      status: 400,
      body: {
        message: "Bad Request",
      },
    };
  }

  const prisma = new PrismaClient();
  const newGame: game = await prisma.game.create({
    data: {
      ...body,
      date: new Date(body.date),
      user_id: user.id,
    },
  });

  return newGame;
});
