import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

export async function getScriptsOfTheWeek(prisma: PrismaClient, limit = 5) {
  const games = await prisma.game.findMany({
    where: {
      parent_game_id: null,
      script: {
        not: "",
      },
      AND: {
        script: {
          not: "Custom",
        },
      },
      associated_script: {
        author: {
          not: "The Pandemonium Institute",
        },
        is_custom_script: false,
      },
      // Games played last week (sunday to saturday)
      date: {
        gte: dayjs().subtract(7, "day").startOf("week").startOf("day").toDate(),
        lte: dayjs().subtract(7, "day").endOf("week").endOf("day").toDate(),
      },
    },
    select: {
      associated_script: true,
    },
  });

  const scripts: {
    script_id: string;
    script: string;
    version: string;
    author: string;
    games: number;
  }[] = [];

  for (const game of games) {
    if (game.associated_script) {
      const script = scripts.find(
        (script) => script.script_id === game.associated_script?.script_id
      );

      if (script) {
        script.games++;
      } else {
        scripts.push({
          script_id: game.associated_script.script_id,
          script: game.associated_script.name,
          version: game.associated_script.version,
          author: game.associated_script.author,
          games: 1,
        });
      }
    }
  }

  return scripts.toSorted((a, b) => b.games - a.games).slice(0, limit);
}
