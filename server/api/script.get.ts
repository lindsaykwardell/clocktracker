import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const { query } = getQuery(handler) as { query: string };

  const prisma = new PrismaClient();

  return await prisma.script.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 10,
    select: {
      id: true,
      name: true,
    },
  });
});
