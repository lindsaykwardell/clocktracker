import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;
  const user = handler.context.user as User;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
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
          user_id: user.id,
          friend_id: otherUser.user_id,
        },
        {
          user_id: otherUser.user_id,
          friend_id: user.id,
        },
      ],
    },
  });

  return true;
});
