import { PrismaClient, Alignment, WinStatus_V2 } from "@prisma/client";
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
      if (
        (lastCharacter.alignment === Alignment.GOOD &&
          game.win_v2 === WinStatus_V2.GOOD_WINS) ||
        (lastCharacter.alignment === Alignment.EVIL &&
          game.win_v2 === WinStatus_V2.EVIL_WINS)
      ) {
        win_loss.wins++;
      } else if (game.win_v2 !== WinStatus_V2.NOT_RECORDED) {
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
    orderBy: [
      {
        _count: {
          script_id: "desc",
        },
      },
      {
        script: "asc",
      },
    ],
    _count: {
      script_id: true,
    },
  });

  const popular_scripts_formatted = [];

  for (const script of popular_scripts) {
    let logo: string | null = null;
    let version: string | null = null;
    let custom_script_id: string | null = null;

    if (script.script_id) {
      const associated_script = await prisma.script.findUnique({
        where: {
          id: script.script_id,
        },
        select: {
          logo: true,
          version: true,
          script_id: true,
          is_custom_script: true,
        },
      });

      if (associated_script) {
        logo = associated_script.logo;
        version = associated_script.version;
        if (associated_script.is_custom_script) {
          custom_script_id = associated_script.script_id;
        }
      }
    }

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
        if (
          (lastCharacter.alignment === Alignment.GOOD &&
            game.win_v2 === WinStatus_V2.GOOD_WINS) ||
          (lastCharacter.alignment === Alignment.EVIL &&
            game.win_v2 === WinStatus_V2.EVIL_WINS)
        ) {
          wins++;
        }
      }
    }

    const pct = +((wins / total) * 100).toFixed(2);

    popular_scripts_formatted.push({
      script_id: script.script_id,
      script: script.script,
      version,
      custom_script_id,
      logo: logo,
      wins,
      pct,
      count: script._count.script_id,
    });
  }

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
