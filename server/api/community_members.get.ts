import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

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

  const members = communityMembers.flatMap((community) => community.members);
  // filter out duplicates
  const uniqueMembers = members.filter(
    (member, index) =>
      members.findIndex((m) => m.user_id === member.user_id) === index
  );

  return uniqueMembers;
});
