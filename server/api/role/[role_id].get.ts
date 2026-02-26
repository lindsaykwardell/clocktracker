import dayjs from "dayjs";
import { prisma } from "~/server/utils/prisma";

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

  const escapedRoleId = role_id.replace(/'/g, "''");

  // Run independent queries in parallel
  const [totalCount, winLossRows, gameMonthDates, popular_scripts] =
    await Promise.all([
      // Total count of games with this role (any character position)
      prisma.game.count({
        where: {
          player_characters: {
            some: {
              role_id,
            },
          },
        },
      }),

      // Win/loss where the LAST character has this role, grouped by script_id
      // so we can derive both overall and per-script rates from one query
      prisma.$queryRawUnsafe<
        {
          script_id: number | null;
          wins: bigint;
          losses: bigint;
        }[]
      >(`
        WITH last_chars AS (
          SELECT DISTINCT ON (c."game_id")
            c."game_id", c."role_id", c."alignment"
          FROM "Character" c
          WHERE c."game_id" IN (
            SELECT DISTINCT c2."game_id"
            FROM "Character" c2
            WHERE c2."role_id" = '${escapedRoleId}' AND c2."game_id" IS NOT NULL
          )
          ORDER BY c."game_id", c."id" DESC
        )
        SELECT
          g."script_id",
          COUNT(*) FILTER (WHERE
            (lc."alignment" = 'GOOD' AND g."win_v2" = 'GOOD_WINS') OR
            (lc."alignment" = 'EVIL' AND g."win_v2" = 'EVIL_WINS')
          )::bigint AS wins,
          COUNT(*) FILTER (WHERE
            g."win_v2" != 'NOT_RECORDED' AND NOT (
              (lc."alignment" = 'GOOD' AND g."win_v2" = 'GOOD_WINS') OR
              (lc."alignment" = 'EVIL' AND g."win_v2" = 'EVIL_WINS')
            )
          )::bigint AS losses
        FROM last_chars lc
        JOIN "Game" g ON g."id" = lc."game_id"
        WHERE lc."role_id" = '${escapedRoleId}'
        GROUP BY g."script_id"
      `),

      // Game dates for the past 12 months (lightweight, no characters loaded)
      prisma.game.findMany({
        where: {
          player_characters: {
            some: {
              role_id,
            },
          },
          date: {
            gte: dayjs().subtract(12, "month").toDate(),
          },
        },
        select: { date: true },
      }),

      // Top 10 most played scripts with this role (already efficient)
      prisma.game.groupBy({
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
        take: 10,
      }),
    ]);

  // Compute overall win/loss by summing across all scripts
  let totalWins = 0;
  let totalLosses = 0;
  const winRateByScript = new Map<
    number | null,
    { wins: number; losses: number }
  >();

  for (const row of winLossRows) {
    const w = Number(row.wins);
    const l = Number(row.losses);
    totalWins += w;
    totalLosses += l;
    winRateByScript.set(row.script_id, { wins: w, losses: l });
  }

  const winLossTotal = totalWins + totalLosses;

  // Build games_by_month
  const months = Array.from(Array(12).keys())
    .map((i) => dayjs().subtract(i, "month").format("MMMM"))
    .reverse();

  const games_by_month: Record<string, number> = Object.fromEntries(
    months.map((month) => [month, 0])
  );

  for (const game of gameMonthDates) {
    const month = dayjs(game.date).format("MMMM");
    if (month in games_by_month) {
      games_by_month[month]++;
    }
  }

  // Batch fetch script metadata (instead of N+1 findUnique per script)
  const scriptIds = popular_scripts
    .map((s) => s.script_id)
    .filter((id): id is number => id !== null);

  const scriptsMap = new Map<
    number,
    {
      logo: string | null;
      version: string | null;
      script_id: string;
      is_custom_script: boolean;
    }
  >();

  if (scriptIds.length > 0) {
    const scripts = await prisma.script.findMany({
      where: { id: { in: scriptIds } },
      select: {
        id: true,
        logo: true,
        version: true,
        script_id: true,
        is_custom_script: true,
      },
    });
    for (const s of scripts) {
      scriptsMap.set(s.id, s);
    }
  }

  // Format popular scripts with win rates from the SQL result
  const popular_scripts_formatted = popular_scripts.map((script) => {
    const meta = script.script_id ? scriptsMap.get(script.script_id) : null;
    const rates = winRateByScript.get(script.script_id) ?? {
      wins: 0,
      losses: 0,
    };
    const scriptTotal = rates.wins + rates.losses;
    const pct =
      scriptTotal === 0 ? 0 : +((rates.wins / scriptTotal) * 100).toFixed(2);

    return {
      script_id: script.script_id,
      script: script.script,
      version: meta?.version ?? null,
      custom_script_id: meta?.is_custom_script ? meta.script_id : null,
      logo: meta?.logo ?? null,
      wins: rates.wins,
      pct,
      count: script._count.script_id,
    };
  });

  return {
    role,
    win_loss: {
      wins: totalWins,
      losses: totalLosses,
      pct:
        winLossTotal === 0
          ? 0
          : +((totalWins / winLossTotal) * 100).toFixed(2),
    },
    popular_scripts: popular_scripts_formatted,
    games_by_month,
    count: totalCount,
  };
});
