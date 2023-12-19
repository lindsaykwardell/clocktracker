import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const gameId = handler.context.params?.id;

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: user.id,
      deleted: false,
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      waiting_for_confirmation: false,
    },
    include: {
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
        orderBy: {
          id: "asc",
        },
      },
      community: {
        select: {
          slug: true,
          icon: true,
        },
      },
    },
  });
});
