import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const { query } = getQuery(handler) as { query: string };

  const prisma = new PrismaClient();

  // Don't query if it's too small
  if (query.length < 3) {
    return [];
  }

  const users = await prisma.userSettings.findMany({
    where: {
      OR: [
        {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          display_name: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  return users.map((user) => ({
    user_id: user.user_id,
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    pronouns: user.pronouns,
    bio: user.bio,
    location: user.location,
  }));
});
