import { PrismaClient, Game, Character } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;

  const prisma = new PrismaClient();
  const user = await prisma.userSettings.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const games = await prisma.game.findMany({
    where: {
      user_id: user?.user_id,
    },
    include: {
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
    },
  });

  return games;
});
