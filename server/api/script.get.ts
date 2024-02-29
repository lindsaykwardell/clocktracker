import { PrismaClient } from "@prisma/client";
import naturalOrder from "natural-order";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const { query, author } = getQuery(handler) as {
    query: string;
    author: string;
  };

  const scripts = await prisma.script.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
      author: {
        contains: author,
        mode: "insensitive",
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      script_id: true,
      name: true,
      version: true,
    },
  });

  const results: {
    id: number;
    script_id: number;
    name: string;
    version: string;
  }[] = [];

  for (const script of naturalOrder(scripts)
    .orderBy("desc")
    .sort(["version", "name"])) {
    if (
      results.length < 10 &&
      !results.some((s) => s.script_id === script.script_id)
    ) {
      results.push({
        id: script.id,
        script_id: script.script_id,
        name: script.name,
        version: script.version,
      });
    }
  }

  return results;
});
