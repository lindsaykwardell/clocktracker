import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const { query } = getQuery(handler) as { query: string };

  // Don't query if it's too small
  if (query.length < 3) {
    return [];
  }

  return prisma.userSettings.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              privacy: PrivacySetting.PUBLIC,
            },
            {
              privacy: PrivacySetting.PRIVATE,
            },
            {
              privacy: PrivacySetting.FRIENDS_ONLY,
              friends: {
                some: {
                  friend_id: me?.id || "",
                },
              },
            },
          ],
        },
        {
          OR: [
            {
              username: {
                search: query,
                mode: "insensitive",
              },
            },
            {
              display_name: {
                search: query,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      pronouns: true,
      bio: true,
      location: true,
      charts: true,
    },
  });
});
