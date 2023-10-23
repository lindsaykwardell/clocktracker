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
      OR: [
        // PUBLIC PROFILE
        // PUBLIC GAME
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // PRIVATE PROFILE
        // PUBLIC GAME
        // No filtering done here, because the game is public.
        // We'll need to anonymize the user's profile, though.
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // FRIENDS ONLY PROFILE
        // PUBLIC GAME
        // No filtering done here, because the game is public.
        // We'll need to anonymize the user's profile, though.
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
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
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
      ],
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
