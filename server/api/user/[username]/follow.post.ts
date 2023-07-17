import type { User } from "@supabase/supabase-js";
import { PrismaClient, UserSettings } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const prisma = new PrismaClient();

  const existingUser = await prisma.userSettings.findFirst({
    where: {
      username: username,
    },
    include: {
      followers: {
        select: {
          user: {
            select: {
              user_id: true,
            },
          },
        },
      },
    },
  });

  if (!existingUser) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Check if the user is already following this user id
  const isFollowing = existingUser.followers.some(
    (follower) => follower.user.user_id === user.id
  );

  // If they're already following, then unfollow and delete the record.
  if (isFollowing) {
    await prisma.following.delete({
      where: {
        user_id_following_id: {
          user_id: user.id,
          following_id: existingUser.user_id,
        },
      },
    });

    return false;
  }

  await prisma.following.create({
    data: {
      user_id: user.id,
      following_id: existingUser.user_id,
    },
  });

  return true;
});
