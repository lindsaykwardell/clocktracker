import { PrismaClient, Alignment, WinStatus_V2 } from "@prisma/client";
// @ts-ignore
import dayjs from "dayjs";
import { winRateByRole } from "~/server/utils/stats";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const script_id = +handler.context.params!.id;

  const script = await prisma.script.findFirst({
    where: {
      id: script_id,
    },
    include: {
      roles: true,
    },
  });

  if (!script) {
    throw createError({
      status: 404,
      message: "Script not found",
    });
  }

  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      AND: [
        {
          OR: [
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
          ignore_for_stats: false,
        },
      ],
    },
    select: {
      win_v2: true,
      date: true,
      is_storyteller: true,
      grimoire: {
        select: {
          tokens: {
            select: {
              role_id: true,
              alignment: true,
            },
          },
        },
      },
      player_characters: {
        select: {
          role_id: true,
          alignment: true,
        },
      },
    },
  });

  const good_win_count = games.reduce(
    (acc, game) => {
      let win = acc.win;

      if (game.win_v2 === WinStatus_V2.GOOD_WINS) {
        win = acc.win + 1;
      }

      return { total: acc.total + 1, win };
    },
    { total: 0, win: 0 }
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

  // Ge the win rate for each role on the script.
  const role_win_rates = script.roles.reduce((acc, role) => {
    const win_count = games.reduce(
      (acc, game) => {
        let win = acc.win;

        const character = (() => {
          if (game.is_storyteller) {
            return game.grimoire[game.grimoire.length - 1]?.tokens.find(
              (token) => token.role_id === role.id
            );
          } else {
            return game.player_characters[game.player_characters.length - 1];
          }
        })();

        if (!character || character.role_id !== role.id) return acc;

        if (
          game.win_v2 === WinStatus_V2.GOOD_WINS &&
          character.alignment === Alignment.GOOD
        ) {
          win++;
        } else if (
          game.win_v2 === WinStatus_V2.EVIL_WINS &&
          character.alignment === Alignment.EVIL
        ) {
          win++;
        }

        return { total: acc.total + 1, win };
      },
      { total: 0, win: 0 }
    );

    return {
      ...acc,
      [role.id]: { ...win_count, loss: win_count.total - win_count.win },
    };
  }, {} as Record<string, { total: number; win: number; loss: number }>);

  return {
    count: games.length,
    win_loss: {
      total: good_win_count.total,
      win: good_win_count.win,
      loss: good_win_count.total - good_win_count.win,
      pct: +((good_win_count.win / good_win_count.total) * 100).toFixed(2),
    },
    games_by_month,
    role_win_rates,
    // scripts: most_common_scripts,
    // most_common_scripts,
  };
});
