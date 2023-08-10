import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const friends = await prisma.friend.findMany({
    where: {
      user_id: user.id,
    },
    select: {
      friend: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
          pronouns: true,
          bio: true,
          location: true,
          privacy: true,
        },
      },
    },
    orderBy: {
      friend: {
        display_name: "asc",
      },
    },
  });

  return friends;
});
