import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;
  const signedInUser = handler.context.user as User | null;

  const user = await prisma.userSettings.findUnique({
    where: {
      username,
    },
    select: {
      user_id: true,
      privacy: true,
      friends: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // If the user's privacy setting is PRIVATE AND one of the following is true:
  // 1. The signed-in user is not the user whose profile is being requested
  // 2. The signed-in user is not a friend of the user whose profile is being requested
  // Then return an empty array.
  if (
    user.privacy === PrivacySetting.PRIVATE &&
    (!signedInUser || signedInUser.id !== user.user_id) &&
    (!signedInUser ||
      !user.friends.some((friend) => friend.user_id === signedInUser.id))
  ) {
    return [];
  }

  const games = await prisma.game.findMany({
    where: {
      user_id: user?.user_id,
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
  });

  return games;
});
