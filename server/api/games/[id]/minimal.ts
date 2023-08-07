import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const gameId = handler.context.params?.id;
  const signedInUser = handler.context.user as User | null;

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user: !signedInUser
        ? { privacy: PrivacySetting.PUBLIC }
        : {
            OR: [
              {
                privacy: PrivacySetting.PUBLIC,
              },
              {
                privacy: PrivacySetting.PRIVATE,
                AND: {
                  OR: [
                    {
                      user_id: signedInUser.id,
                    },
                    {
                      friends: {
                        some: {
                          user_id: signedInUser.id,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
    },
    select: {
      date: true,
      script: true,
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return game;
});
