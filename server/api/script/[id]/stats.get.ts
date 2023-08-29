import { PrismaClient, Alignment, Role } from "@prisma/client";
import naturalOrder from "natural-order";
// @ts-ignore
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const script_id = +handler.context.params!.id;
  const script_name = await prisma.script
    .findFirst({
      where: {
        id: +script_id!,
      },
      select: {
        name: true,
      },
    })
    .then((script) => script?.name);

  const games = await prisma.game.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              script: {
                equals: script_name,
                mode: "insensitive",
              },
            },
            {
              script_id,
            },
            script_id === 134
              ? {
                  script: {
                    equals: "Sects & Violets",
                    mode: "insensitive",
                  },
                }
              : {},
          ],
        },
        {
          parent_game_id: null,
        },
      ],
    },
    include: {
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
              name: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  const most_common_roles = Object.fromEntries(
    naturalOrder(
      Object.entries(
        games
          .flatMap((game): string[] => {
            if (game.is_storyteller) {
              return game.grimoire[game.grimoire.length - 1].tokens
                .filter((token) => !!token.role)
                .map((token) => token.role!.name);
            } else {
              return game.player_characters
                .filter((character) => !!character.name)
                .map((character) => character.name);
            }
          })
          .reduce((acc, role) => {
            acc[role] = (acc[role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      )
    )
      .orderBy("desc")
      .sort(["1"])
  );

  const good_win_count = games.reduce(
    (acc, game) => {
      let win = acc.win;
      if (game.is_storyteller) {
        win = game.win ? acc.win + 1 : acc.win;
      } else {
        const last_character =
          game.player_characters[game.player_characters.length - 1];
        if (last_character) {
          win =
            last_character.alignment === Alignment.GOOD ? acc.win + 1 : acc.win;
        }
      }

      return { total: acc.total + 1, win };
    },
    { total: 0, win: 0 }
  );

  const most_common_scripts = Object.fromEntries(
    naturalOrder(
      Object.entries(
        games
          .filter((game) => !!game.script)
          .map((game) => ({
            script: game.script,
            script_id: game.script_id as number,
            win: game.win,
          }))
          .reduce((acc, script) => {
            const formatted_script = script.script;
            acc[formatted_script] = (acc[formatted_script] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      )
    )
      .orderBy("desc")
      .sort(["1"])
  );

  // Get the count of games played over the past 12 months
  const months = Array.from(Array(12).keys())
    .map((i) => dayjs().subtract(i, "month").format("MMMM"))
    .reverse();

  const games_by_month = Object.fromEntries(months.map((month) => [month, 0]));

  games.forEach((game) => {
    // If the game is not in the past 12 months, skip it
    if (dayjs(game.date).isBefore(dayjs().subtract(12, "month"))) {
      return;
    }
    const month = dayjs(game.date).format("MMMM");
    games_by_month[month] = games_by_month[month] + 1;
  });

  return {
    count: games.length,
    most_common_roles,
    win_loss: {
      total: good_win_count.total,
      win: good_win_count.win,
      loss: good_win_count.total - good_win_count.win,
      pct: +((good_win_count.win / good_win_count.total) * 100).toFixed(2),
    },
    games_by_month,
    // scripts: most_common_scripts,
    // most_common_scripts,
  };
});
