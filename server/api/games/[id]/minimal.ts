import type { User } from "@supabase/supabase-js";
import { PrivacySetting } from "@prisma/client";
import { prisma } from "~/server/utils/prisma";

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
      privacy: true,
      user_id: true,
      user: {
        select: {
          privacy: true,
          display_name: true,
        },
      },
      associated_script: {
        select: {
          logo: true,
        },
      },
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // If the game should be private, anonymize the display name.
  // We need to know if the user is a friend of the game creator
  const isFriend = !!(await prisma.friend.findFirst({
    where: {
      OR: [
        {
          user_id: game.user_id,
          friend_id: me?.id || "",
        },
        {
          user_id: me?.id || "",
          friend_id: game.user_id,
        },
      ],
    },
  }));

  if (
    !isFriend &&
    game.user &&
    (game.user.privacy === PrivacySetting.PRIVATE ||
      game.user.privacy === PrivacySetting.FRIENDS_ONLY)
  ) {
    if (game.user.privacy === PrivacySetting.FRIENDS_ONLY) {
      game.user.display_name = "";
    }
  }

  return game;
});
