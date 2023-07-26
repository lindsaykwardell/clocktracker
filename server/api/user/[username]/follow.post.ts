import type { User } from "@supabase/supabase-js";
import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

function notificationMessage(name?: string) {
  return `${name || "Someone"} followed you!`;
}

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const followingUser = await prisma.userSettings.findFirst({
    where: {
      user_id: user.id,
    },
  });

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

    // Delete notification if it's unread. No need to show it now.
    await prisma.notification.deleteMany({
      where: {
        user_id: existingUser.user_id,
        type: NotificationType.FOLLOW,
        from_user_id: user.id,
        read: false,
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

  // Create a notification for the user that was followed.
  await prisma.notification.create({
    data: {
      user_id: existingUser.user_id,
      from_user_id: user.id,
      type: NotificationType.FOLLOW,
      message: notificationMessage(followingUser?.username),
    },
  });

  return true;
});
