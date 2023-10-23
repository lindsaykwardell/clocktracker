import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const script_id = +handler.context.params!.id;

  return prisma.game.findMany({
    where: {
      user: {
        privacy: PrivacySetting.PUBLIC,
      },
      privacy: PrivacySetting.PUBLIC,
      script_id,
      parent_game_id: null,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
      },
    },
    take: 12,
    orderBy: {
      date: "desc",
    },
  });
});
