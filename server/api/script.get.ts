import { User } from "@supabase/supabase-js";
import naturalOrder from "natural-order";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me = handler.context.user as User | null;
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
      ls_game: {
        is: null,
      },
      OR: [
        {
          user_id: me?.id || "",
        },
        {
          is_custom_script: false,
        },
      ],
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
    script_id: string;
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
        script_id: script.script_id!,
        name: script.name,
        version: script.version,
      });
    }
  }

  return results;
});
