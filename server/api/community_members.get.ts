import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  const userId = getUserId(user);
  if (!userId) {
    return [];
  }

  const communityMembers = await prisma.community.findMany({
    where: {
      members: {
        some: {
          user_id: userId,
        },
      },
    },
    select: {
      members: {
        where: {
          user_id: {
            not: userId,
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

  const members = communityMembers.flatMap((community) => community.members);
  // filter out duplicates
  const uniqueMembers = members.filter(
    (member, index) =>
      members.findIndex((m) => m.user_id === member.user_id) === index
  );

  return uniqueMembers;
});
