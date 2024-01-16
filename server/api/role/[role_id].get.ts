import { PrismaClient, WinStatus } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const role_id = handler.context.params?.role_id as string;

  const role = await prisma.role.findUnique({
    where: {
      id: role_id,
    },
  });

  if (!role) {
    throw createError({
      status: 404,
      message: "Role not found",
    });
  }

  // Fetch all games that have this role
  const games = await prisma.game.findMany({
    where: {
      player_characters: {
        some: {
          role_id,
        },
      },
    },
    include: {
      player_characters: true,
    },
  });

  // Calculate the win/loss ratio for all games
  const win_loss = {
    wins: 0,
    losses: 0,
  };

  for (const game of games) {
    const lastCharacter =
      game.player_characters[game.player_characters.length - 1];

    if (lastCharacter.role_id === role_id) {
      if (game.win === WinStatus.WIN) {
        win_loss.wins++;
      } else {
        win_loss.losses++;
      }
    }
  }

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

  // Get top ten most played scripts with this role.
  const popular_scripts = await prisma.game.groupBy({
    by: ["script_id", "script"],
    where: {
      player_characters: {
        some: {
          role_id,
        },
      },
    },
    orderBy: {
      _count: {
        script_id: "desc",
      },
    },
    _count: {
      script_id: true,
    },
    take: 10,
  });

  const popular_scripts_formatted = popular_scripts.map((script) => {
    let wins = 0;
    let total = 0;

    for (const game of games) {
      const lastCharacter =
        game.player_characters[game.player_characters.length - 1];

      if (
        lastCharacter.role_id === role_id &&
        game.script_id === script.script_id
      ) {
        total++;
        if (game.win === WinStatus.WIN) {
          wins++;
        }
      }
    }

    const pct = +((wins / total) * 100).toFixed(2);

    return {
      script_id: script.script_id,
      script: script.script,
      wins,
      pct,
      count: script._count.script_id,
    };
  });

  return {
    role,
    win_loss: {
      ...win_loss,
      pct: +((win_loss.wins / (win_loss.wins + win_loss.losses)) * 100).toFixed(
        2
      ),
    },
    popular_scripts: popular_scripts_formatted,
    games_by_month,
    count: games.length,
  };
});
