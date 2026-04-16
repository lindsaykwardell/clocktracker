import { Prisma } from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";

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

  // Build script filter: either matching script_id or (for S&V id=134) matching name
  const scriptFilter =
    script_id === 134
      ? Prisma.sql`(g."script_id" = ${script_id} OR LOWER(g."script") = 'sects & violets')`
      : Prisma.sql`g."script_id" = ${script_id}`;

  // Overall count + good win count
  const overallResult = await prisma.$queryRaw<
    { total: bigint; good_wins: bigint }[]
  >(Prisma.sql`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE g."win_v2" = 'GOOD_WINS')::bigint AS good_wins
    FROM "Game" g
    WHERE g."deleted" = false
      AND g."parent_game_id" IS NULL
      AND g."ignore_for_stats" = false
      AND ${scriptFilter}
  `);

  const total = Number(overallResult[0]?.total ?? 0);
  const goodWins = Number(overallResult[0]?.good_wins ?? 0);

  const endTriggerRecordedResult = await prisma.$queryRaw<
    { total: bigint }[]
  >(Prisma.sql`
    SELECT
      COUNT(*)::bigint AS total
    FROM "Game" g
    WHERE g."deleted" = false
      AND g."parent_game_id" IS NULL
      AND g."ignore_for_stats" = false
      AND ${scriptFilter}
      AND g."end_trigger"::text <> 'NOT_RECORDED'
  `);

  const endTriggerRecordedCount = Number(
    endTriggerRecordedResult[0]?.total ?? 0
  );

  const endTriggerRows = await prisma.$queryRaw<
    { end_trigger: string; total: bigint }[]
  >(Prisma.sql`
    SELECT
      g."end_trigger"::text AS end_trigger,
      COUNT(*)::bigint AS total
    FROM "Game" g
    WHERE g."deleted" = false
      AND g."parent_game_id" IS NULL
      AND g."ignore_for_stats" = false
      AND ${scriptFilter}
      AND g."end_trigger"::text <> 'NOT_RECORDED'
    GROUP BY g."end_trigger"::text
  `);

  const end_trigger_counts = Object.fromEntries(
    endTriggerRows.map((row) => [row.end_trigger, Number(row.total)])
  );

  const endTriggerDetailRows = await prisma.$queryRaw<
    { end_trigger: string; detail: string; total: bigint }[]
  >(Prisma.sql`
    SELECT
      g."end_trigger"::text AS end_trigger,
      CASE
        WHEN g."end_trigger_cause"::text = 'ABILITY'
          AND g."end_trigger_role_id" IS NOT NULL
          THEN 'ABILITY:' || g."end_trigger_role_id"
        WHEN g."end_trigger_cause"::text = 'ABILITY' THEN 'Ability'
        WHEN g."end_trigger_cause"::text = 'NOMINATION'
          AND g."end_trigger_type"::text = 'EXECUTION'
          AND g."end_trigger"::text = 'NO_LIVING_DEMON'
          THEN 'Demon Executed'
        WHEN g."end_trigger_cause"::text = 'NOMINATION'
          AND g."end_trigger_type"::text = 'EXECUTION'
          AND g."end_trigger"::text = 'TWO_PLAYERS_LEFT_ALIVE'
          THEN 'Demon Alive'
        WHEN g."end_trigger_cause"::text = 'NOMINATION'
          AND g."end_trigger_type"::text = 'EXECUTION'
          THEN 'NOMINATION_EXECUTION'
        WHEN g."end_trigger_cause"::text = 'NOMINATION' THEN 'NOMINATION'
        WHEN g."end_trigger_cause"::text = 'FAILED_ABILITY' THEN 'FAILED_ABILITY'
        WHEN g."end_trigger_type" IS NOT NULL THEN 'TYPE_ONLY'
        ELSE 'UNKNOWN'
      END AS detail,
      COUNT(*)::bigint AS total
    FROM "Game" g
    WHERE g."deleted" = false
      AND g."parent_game_id" IS NULL
      AND g."ignore_for_stats" = false
      AND ${scriptFilter}
      AND g."end_trigger"::text <> 'NOT_RECORDED'
    GROUP BY 1, 2
  `);

  const end_trigger_detail_counts: Record<string, Record<string, number>> = {};
  for (const row of endTriggerDetailRows) {
    end_trigger_detail_counts[row.end_trigger] ??= {};
    end_trigger_detail_counts[row.end_trigger][row.detail] = Number(row.total);
  }

  const endTriggerRoleIds = [
    ...new Set(
      endTriggerDetailRows
        .map((row) => row.detail)
        .filter((detail) => detail.startsWith("ABILITY:"))
        .map((detail) => detail.replace("ABILITY:", ""))
    ),
  ];

  const end_trigger_roles = endTriggerRoleIds.length
    ? Object.fromEntries(
        (
          await prisma.role.findMany({
            where: {
              id: {
                in: endTriggerRoleIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        ).map((role) => [role.id, role])
      )
    : {};

  // Games by month (last 12 months)
  const monthRows = await prisma.$queryRaw<
    { month_name: string; count: bigint }[]
  >(Prisma.sql`
    SELECT
      TO_CHAR(g."date", 'Month') AS month_name,
      COUNT(*)::bigint AS count
    FROM "Game" g
    WHERE g."deleted" = false
      AND g."parent_game_id" IS NULL
      AND g."ignore_for_stats" = false
      AND ${scriptFilter}
      AND g."date" >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY TO_CHAR(g."date", 'Month')
  `);

  // Build last 12 months array
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthNames[d.getMonth()]);
  }

  const games_by_month: Record<string, number> = {};
  for (const m of months) {
    games_by_month[m] = 0;
  }
  for (const row of monthRows) {
    const name = row.month_name.trim();
    if (name in games_by_month) {
      games_by_month[name] = Number(row.count);
    }
  }

  // Per-role win rates via SQL
  // CTE: for each game, get the "last character" role_id + alignment
  // For non-storyteller games: last Character row
  // For storyteller games: tokens from last grimoire page matching the role
  const roleIds = script.roles.map((r) => r.id);

  let role_win_rates: Record<
    string,
    { total: number; win: number; loss: number }
  > = {};
  const role_ability_endings: Record<string, number> = {};

  if (roleIds.length > 0) {
    const roleIdList = Prisma.join(roleIds);

    const roleWinRows = await prisma.$queryRaw<
      {
        role_id: string;
        total: bigint;
        wins: bigint;
      }[]
    >(Prisma.sql`
      WITH last_player_char AS (
        -- For non-storyteller games: the last Character per game
        SELECT DISTINCT ON (c."game_id")
          c."game_id",
          c."role_id",
          c."alignment"
        FROM "Character" c
        JOIN "Game" g ON g."id" = c."game_id"
        WHERE g."deleted" = false
          AND g."parent_game_id" IS NULL
          AND g."ignore_for_stats" = false
          AND g."is_storyteller" = false
          AND ${scriptFilter}
          AND c."role_id" IN (${roleIdList})
        ORDER BY c."game_id", c."id" DESC
      ),
      last_grimoire_page AS (
        -- For storyteller games: find the last grimoire page per game
        SELECT gg."A" AS game_id, MAX(gg."B") AS grimoire_id
        FROM "_GameToGrimoire" gg
        JOIN "Game" g ON g."id" = gg."A"
        WHERE g."deleted" = false
          AND g."parent_game_id" IS NULL
          AND g."ignore_for_stats" = false
          AND g."is_storyteller" = true
          AND ${scriptFilter}
        GROUP BY gg."A"
      ),
      st_tokens AS (
        -- Storyteller game tokens from last grimoire page
        SELECT
          lgp.game_id,
          t."role_id",
          t."alignment"
        FROM last_grimoire_page lgp
        JOIN "Token" t ON t."grimoire_id" = lgp.grimoire_id
        WHERE t."role_id" IN (${roleIdList})
      ),
      all_entries AS (
        SELECT game_id, role_id, alignment FROM last_player_char
        UNION ALL
        SELECT game_id, role_id, alignment FROM st_tokens
      ),
      joined AS (
        SELECT
          ae.role_id,
          ae.alignment,
          g."win_v2"
        FROM all_entries ae
        JOIN "Game" g ON g."id" = ae.game_id
      )
      SELECT
        j.role_id,
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE
          (j."win_v2" = 'GOOD_WINS' AND j.alignment = 'GOOD')
          OR (j."win_v2" = 'EVIL_WINS' AND j.alignment = 'EVIL')
        )::bigint AS wins
      FROM joined j
      GROUP BY j.role_id
    `);

    for (const row of roleWinRows) {
      const t = Number(row.total);
      const w = Number(row.wins);
      role_win_rates[row.role_id] = { total: t, win: w, loss: t - w };
    }

    const roleAbilityEndingRows = await prisma.$queryRaw<
      {
        role_id: string;
        total: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        g."end_trigger_role_id" AS role_id,
        COUNT(*)::bigint AS total
      FROM "Game" g
      WHERE g."deleted" = false
        AND g."parent_game_id" IS NULL
        AND g."ignore_for_stats" = false
        AND ${scriptFilter}
        AND g."end_trigger"::text <> 'NOT_RECORDED'
        AND g."end_trigger_cause"::text = 'ABILITY'
        AND g."end_trigger_role_id" IN (${roleIdList})
      GROUP BY g."end_trigger_role_id"
    `);

    for (const row of roleAbilityEndingRows) {
      role_ability_endings[row.role_id] = Number(row.total);
    }
  }

  // Fill in roles with zero games
  for (const role of script.roles) {
    if (!role_win_rates[role.id]) {
      role_win_rates[role.id] = { total: 0, win: 0, loss: 0 };
    }
    if (!role_ability_endings[role.id]) {
      role_ability_endings[role.id] = 0;
    }
  }

  return {
    count: total,
    win_loss: {
      total,
      win: goodWins,
      loss: total - goodWins,
      pct: total > 0 ? +((goodWins / total) * 100).toFixed(2) : 0,
    },
    end_trigger_recorded_count: endTriggerRecordedCount,
    end_trigger_counts,
    end_trigger_detail_counts,
    end_trigger_roles,
    games_by_month,
    role_win_rates,
    role_ability_endings,
  };
});
