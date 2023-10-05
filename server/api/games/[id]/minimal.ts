import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const gameId = handler.context.params?.id;
  const me: User | null = handler.context.user;

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      deleted: false,
      user: {
        OR: [
          {
            privacy: PrivacySetting.PUBLIC,
          },
          {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                sent_friend_requests: {
                  some: {
                    user_id: me?.id || "",
                    accepted: false,
                  },
                },
              },
              {
                friend_requests: {
                  some: {
                    from_user_id: me?.id || "",
                    accepted: false,
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          {
            privacy: PrivacySetting.PERSONAL,
            user_id: me?.id || "",
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
