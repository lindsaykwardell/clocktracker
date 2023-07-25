import { PrismaClient, Game, Character } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user_id = handler.context.user?.id;

  const prisma = new PrismaClient();
  const user = user_id
    ? await prisma.userSettings.findUnique({
        where: {
          user_id,
        },
        include: {
          following: {
            select: {
              following_id: true,
            },
          },
        },
      })
    : null;

  const following = [];

  if (user) {
    const followingUserIds = await prisma.userSettings.findMany({
      where: {
        user_id: {
          in: user.following.map((f) => f.following_id),
        },
      },
      select: {
        user_id: true,
      },
    });

    following.push(...followingUserIds.map((f) => f.user_id));
  }

  const games = await prisma.game.findMany({
    where: following.length
      ? {
          user_id: {
            in: following,
            not: user_id,
          },
        }
      : {
          user_id: {
            not: user_id,
          },
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
      user: {
        select: {
          user_id: true,
          username: true,
          avatar: true,
          display_name: true,
          pronouns: true,
          location: true,
        },
      },
    },
    take: 10,
    orderBy: {
      created_at: "desc",
    },
  });

  return games;
});
