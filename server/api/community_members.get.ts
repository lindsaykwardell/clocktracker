import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  const communityMembers = await prisma.community.findMany({
    where: {
      members: {
        some: {
          user_id: user.id,
        },
      },
    },
    select: {
      members: {
        where: {
          user_id: {
            not: user.id,
          },
        },
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
  });

  return communityMembers.flatMap((community) => community.members);
});
