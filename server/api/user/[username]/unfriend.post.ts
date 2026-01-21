import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;
  const user = handler.context.user as User;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
    });
  }

  const otherUser = await prisma.userSettings.findUnique({
    where: {
      username,
    },
  });

  if (!otherUser) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  await prisma.friend.deleteMany({
    where: {
      OR: [
        {
          user_id: userId,
          friend_id: otherUser.user_id,
        },
        {
          user_id: otherUser.user_id,
          friend_id: userId,
        },
      ],
    },
  });

  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        {
          from_user_id: userId,
          user_id: otherUser.user_id,
        },
        {
          from_user_id: otherUser.user_id,
          user_id: userId,
        },
      ],
    }
  })

  return true;
});
