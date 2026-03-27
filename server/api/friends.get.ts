import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  const friends = await prisma.friend.findMany({
    take: 500,
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
          charts: true,
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
