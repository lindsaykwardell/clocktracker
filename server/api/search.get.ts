import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const { query } = getQuery(handler) as { query: string };

  // Don't query if it's too small
  if (query.length < 3) {
    return [];
  }

  return prisma.userSettings.findMany({
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
