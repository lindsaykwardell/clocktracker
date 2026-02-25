import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const name = handler.context.params?.type as string;
  let { script, compared_to_role, game_size } = getQuery(handler) as {
    script?: string;
    compared_to_role?: string | string[];
    game_size?: "teensy" | "small" | "medium" | "large";
  };

  if (typeof compared_to_role === "string") {
    compared_to_role = [compared_to_role];
  } else if (!Array.isArray(compared_to_role)) {
    compared_to_role = [];
  }

  const role = await prisma.role.findFirst({
    where: {
      name: {
        equals: decodeURIComponent(name),
        mode: "insensitive",
      },
    },
  });

  if (!role) {
    console.error(`Role not found for name ${name}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Build dynamic WHERE clauses for SQL
  const conditions: string[] = [
    `g."deleted" = false`,
    `g."parent_game_id" IS NULL`,
  ];
  const escapedRoleId = role.id.replace(/'/g, "''");

  if (script) {
    const escapedScript = script.replace(/'/g, "''");
    conditions.push(`LOWER(g."script") = LOWER('${escapedScript}')`);
  }

  // Game size filter
  switch (game_size) {
    case "teensy":
      conditions.push(`g."player_count" <= 6`);
      break;
    case "small":
      conditions.push(`g."player_count" > 6 AND g."player_count" <= 9`);
      break;
    case "medium":
      conditions.push(`g."player_count" > 9 AND g."player_count" <= 12`);
      break;
    case "large":
      conditions.push(`g."player_count" > 12`);
      break;
  }

  // compared_to_role filters: each role must appear in the game
  for (const compRole of compared_to_role) {
    const escapedCompRole = compRole.replace(/'/g, "''");
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM "Character" cc
        WHERE cc."game_id" = g."id"
        AND LOWER(cc."name") = LOWER('${escapedCompRole}')
      )
      OR EXISTS (
        SELECT 1 FROM "_GameToGrimoire" cgg
        JOIN "Token" ct ON ct."grimoire_id" = cgg."B"
        JOIN "Role" cr ON cr."id" = ct."role_id"
        WHERE cgg."A" = g."id"
        AND LOWER(cr."name") = LOWER('${escapedCompRole}')
      )
    )`);
  }

  const whereClause = conditions.join(" AND ");

  // Win rate query: find games where this role appears, get last character/token
  const winRateRows = await prisma.$queryRawUnsafe<
    { total: bigint; wins: bigint }[]
  >(`
    WITH player_games AS (
      -- Non-storyteller games: last Character per game with this role
      SELECT DISTINCT ON (c."game_id")
        c."game_id",
        c."alignment"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${whereClause}
        AND g."is_storyteller" = false
        AND c."role_id" = '${escapedRoleId}'
      ORDER BY c."game_id", c."id" DESC
    ),
    st_games AS (
      -- Storyteller games: tokens from last grimoire page with this role
      SELECT DISTINCT ON (lgp.game_id)
        lgp.game_id,
        t."alignment"
      FROM (
        SELECT gg."A" AS game_id, MAX(gg."B") AS grimoire_id
        FROM "_GameToGrimoire" gg
        JOIN "Game" g ON g."id" = gg."A"
        WHERE ${whereClause}
          AND g."is_storyteller" = true
        GROUP BY gg."A"
      ) lgp
      JOIN "Token" t ON t."grimoire_id" = lgp.grimoire_id
      WHERE t."role_id" = '${escapedRoleId}'
      ORDER BY lgp.game_id, t."id" DESC
    ),
    all_games AS (
      SELECT game_id, alignment FROM player_games
      UNION ALL
      SELECT game_id, alignment FROM st_games
    )
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE
        (g."win_v2" = 'GOOD_WINS' AND ag.alignment = 'GOOD')
        OR (g."win_v2" = 'EVIL_WINS' AND ag.alignment = 'EVIL')
      )::bigint AS wins
    FROM all_games ag
    JOIN "Game" g ON g."id" = ag.game_id
  `);

  const totalGames = Number(winRateRows[0]?.total ?? 0);
  const wins = Number(winRateRows[0]?.wins ?? 0);

  // Get distinct scripts for these games
  const scriptRows = await prisma.$queryRawUnsafe<{ script: string }[]>(`
    SELECT DISTINCT g."script"
    FROM "Game" g
    WHERE ${whereClause}
      AND (
        EXISTS (
          SELECT 1 FROM "Character" c
          WHERE c."game_id" = g."id" AND c."role_id" = '${escapedRoleId}'
        )
        OR EXISTS (
          SELECT 1 FROM "_GameToGrimoire" gg
          JOIN "Token" t ON t."grimoire_id" = gg."B"
          WHERE gg."A" = g."id" AND t."role_id" = '${escapedRoleId}'
        )
      )
  `);

  const scripts = scriptRows.map((r) => r.script);

  return {
    role,
    compared_to_role,
    win_loss: {
      total: totalGames,
      win: wins,
      loss: totalGames - wins,
      pct: totalGames > 0 ? +((wins / totalGames) * 100).toFixed(2) : 0,
    },
    scripts,
  };
});
