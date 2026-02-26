import {
  PrivacySetting,
  RoleType,
} from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const year_in_review_id = handler.context.params?.id as string;

  const yearInReview = await prisma.yearInReview.findFirst({
    where: {
      id: year_in_review_id,
      user: {
        OR: [
          { privacy: PrivacySetting.PUBLIC },
          { privacy: PrivacySetting.PRIVATE },
          {
            privacy: PrivacySetting.FRIENDS_ONLY,
            friends: { some: { user_id: me?.id } },
          },
          { user_id: me?.id },
        ],
      },
    },
    include: {
      user: {
        select: {
          privacy: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
    },
  });

  if (!yearInReview) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const userId = yearInReview.user_id;
  const year = yearInReview.year;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const username = yearInReview.user.username;
  const escapedUsername = username.replace(/'/g, "''");
  const escapedUserId = userId.replace(/'/g, "''");

  // Common WHERE clause for this user's games in this year
  const baseWhere = `
    g."deleted" = false
    AND g."user_id" = '${escapedUserId}'
    AND g."date" >= '${yearStart.toISOString()}'
    AND g."date" < '${yearEnd.toISOString()}'
  `;

  // Helper to detect storyteller games (same logic as JS version)
  const isStorytellerExpr = `(
    g."is_storyteller" = true
    OR g."storyteller" = '@${escapedUsername}'
    OR '@${escapedUsername}' = ANY(g."co_storytellers")
  )`;

  // 1. Games played/storytold counts
  const countRows = await prisma.$queryRawUnsafe<
    { games_played: bigint; games_storytold: bigint }[]
  >(`
    SELECT
      COUNT(*) FILTER (WHERE NOT ${isStorytellerExpr})::bigint AS games_played,
      COUNT(*) FILTER (WHERE ${isStorytellerExpr})::bigint AS games_storytold
    FROM "Game" g
    WHERE ${baseWhere}
  `);

  const games_played = Number(countRows[0]?.games_played ?? 0);
  const games_storytold = Number(countRows[0]?.games_storytold ?? 0);

  // 2. Role frequency (top roles) - last Character per non-storyteller game
  const roleRows = await prisma.$queryRawUnsafe<
    {
      role_id: string;
      count: bigint;
      r_id: string;
      r_name: string;
      r_initial_alignment: string;
      r_ability: string;
      r_token_url: string;
      r_type: string;
      r_custom_role: boolean;
    }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."role_id"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      lc.role_id,
      COUNT(*)::bigint AS count,
      r."id" AS r_id,
      r."name" AS r_name,
      r."initial_alignment" AS r_initial_alignment,
      r."ability" AS r_ability,
      r."token_url" AS r_token_url,
      r."type" AS r_type,
      r."custom_role" AS r_custom_role
    FROM last_char lc
    JOIN "Role" r ON r."id" = lc.role_id
    WHERE lc.role_id IS NOT NULL
    GROUP BY lc.role_id, r."id", r."name", r."initial_alignment", r."ability", r."token_url", r."type", r."custom_role"
    ORDER BY count DESC
  `);

  const roles = roleRows.map((row) => ({
    role: {
      id: row.r_id,
      name: row.r_name,
      initial_alignment: row.r_initial_alignment,
      ability: row.r_ability,
      token_url: row.r_token_url,
      type: row.r_type,
      custom_role: row.r_custom_role,
      alternate_token_urls: [] as string[],
    },
    count: Number(row.count),
  }));

  // 3. Related role frequency
  const relatedRoleRows = await prisma.$queryRawUnsafe<
    {
      related_role_id: string;
      count: bigint;
      r_id: string;
      r_name: string;
      r_initial_alignment: string;
      r_ability: string;
      r_token_url: string;
      r_type: string;
      r_custom_role: boolean;
    }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."related_role_id"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      lc.related_role_id,
      COUNT(*)::bigint AS count,
      r."id" AS r_id,
      r."name" AS r_name,
      r."initial_alignment" AS r_initial_alignment,
      r."ability" AS r_ability,
      r."token_url" AS r_token_url,
      r."type" AS r_type,
      r."custom_role" AS r_custom_role
    FROM last_char lc
    JOIN "Role" r ON r."id" = lc.related_role_id
    WHERE lc.related_role_id IS NOT NULL
    GROUP BY lc.related_role_id, r."id", r."name", r."initial_alignment", r."ability", r."token_url", r."type", r."custom_role"
    ORDER BY count DESC
  `);

  const related_roles = relatedRoleRows.map((row) => ({
    role: {
      id: row.r_id,
      name: row.r_name,
      initial_alignment: row.r_initial_alignment,
      ability: row.r_ability,
      token_url: row.r_token_url,
      type: row.r_type,
      custom_role: row.r_custom_role,
      alternate_token_urls: [] as string[],
    },
    count: Number(row.count),
  }));

  // 4. Win rates (overall, good, evil)
  const winRateRows = await prisma.$queryRawUnsafe<
    {
      win_rate: bigint;
      win_rate_good: bigint;
      win_rate_evil: bigint;
      loss_rate: bigint;
    }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."game_id",
        c."alignment"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'GOOD_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'EVIL_WINS')
      )::bigint AS win_rate,
      COUNT(*) FILTER (WHERE
        lc.alignment = 'GOOD' AND g."win_v2" = 'GOOD_WINS'
      )::bigint AS win_rate_good,
      COUNT(*) FILTER (WHERE
        lc.alignment = 'EVIL' AND g."win_v2" = 'EVIL_WINS'
      )::bigint AS win_rate_evil,
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'EVIL_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'GOOD_WINS')
      )::bigint AS loss_rate
    FROM last_char lc
    JOIN "Game" g ON g."id" = lc.game_id
  `);

  const win_rate = Number(winRateRows[0]?.win_rate ?? 0);
  const win_rate_good = Number(winRateRows[0]?.win_rate_good ?? 0);
  const win_rate_evil = Number(winRateRows[0]?.win_rate_evil ?? 0);
  const loss_rate = Number(winRateRows[0]?.loss_rate ?? 0);

  // 5. Role type distribution
  const roleTypeRows = await prisma.$queryRawUnsafe<
    { role_type: string; count: bigint }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."role_id"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      r."type" AS role_type,
      COUNT(*)::bigint AS count
    FROM last_char lc
    JOIN "Role" r ON r."id" = lc.role_id
    WHERE lc.role_id IS NOT NULL
    GROUP BY r."type"
  `);

  const role_types = {
    [RoleType.TOWNSFOLK]: 0,
    [RoleType.OUTSIDER]: 0,
    [RoleType.MINION]: 0,
    [RoleType.DEMON]: 0,
    [RoleType.TRAVELER]: 0,
  };
  for (const row of roleTypeRows) {
    if (row.role_type in role_types) {
      role_types[row.role_type as keyof typeof role_types] = Number(row.count);
    }
  }

  // 6. Winning and losing roles
  const winLoseRoleRows = await prisma.$queryRawUnsafe<
    { role_id: string; win_count: bigint; loss_count: bigint }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."game_id",
        c."role_id",
        c."alignment"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      lc.role_id,
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'GOOD_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'EVIL_WINS')
      )::bigint AS win_count,
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'EVIL_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'GOOD_WINS')
      )::bigint AS loss_count
    FROM last_char lc
    JOIN "Game" g ON g."id" = lc.game_id
    WHERE lc.role_id IS NOT NULL
    GROUP BY lc.role_id
  `);

  const winning_roles = winLoseRoleRows
    .filter((r) => Number(r.win_count) > 0)
    .map((r) => ({ role_id: r.role_id, win_count: Number(r.win_count) }));

  const losing_roles = winLoseRoleRows
    .filter((r) => Number(r.loss_count) > 0)
    .map((r) => ({ role_id: r.role_id, loss_count: Number(r.loss_count) }));

  // 7. Games by month (with win/loss/alignment breakdown)
  const monthlyRows = await prisma.$queryRawUnsafe<
    {
      month_name: string;
      total: bigint;
      wins: bigint;
      losses: bigint;
      good: bigint;
      evil: bigint;
    }[]
  >(`
    WITH last_char AS (
      SELECT DISTINCT ON (c."game_id")
        c."game_id",
        c."alignment"
      FROM "Character" c
      JOIN "Game" g ON g."id" = c."game_id"
      WHERE ${baseWhere}
        AND NOT ${isStorytellerExpr}
        AND c."name" != ''
      ORDER BY c."game_id", c."id" DESC
    )
    SELECT
      TO_CHAR(g."date", 'Month') AS month_name,
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'GOOD_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'EVIL_WINS')
      )::bigint AS wins,
      COUNT(*) FILTER (WHERE
        (lc.alignment = 'GOOD' AND g."win_v2" = 'EVIL_WINS')
        OR (lc.alignment = 'EVIL' AND g."win_v2" = 'GOOD_WINS')
      )::bigint AS losses,
      COUNT(*) FILTER (WHERE lc.alignment = 'GOOD')::bigint AS good,
      COUNT(*) FILTER (WHERE lc.alignment = 'EVIL')::bigint AS evil
    FROM "Game" g
    LEFT JOIN last_char lc ON lc.game_id = g."id"
    WHERE ${baseWhere}
      AND g."date" >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY TO_CHAR(g."date", 'Month')
  `);

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

  const games_by_month: Record<
    string,
    { total: number; win: number; loss: number; good: number; evil: number }
  > = {};
  for (const m of months) {
    games_by_month[m] = { total: 0, win: 0, loss: 0, good: 0, evil: 0 };
  }
  for (const row of monthlyRows) {
    const name = row.month_name.trim();
    if (name in games_by_month) {
      games_by_month[name] = {
        total: Number(row.total),
        win: Number(row.wins),
        loss: Number(row.losses),
        good: Number(row.good),
        evil: Number(row.evil),
      };
    }
  }

  // 8. Most common scripts (top 5)
  const scriptRows = await prisma.$queryRawUnsafe<
    { script: string; logo: string | null; count: bigint }[]
  >(`
    SELECT
      g."script",
      s."logo",
      COUNT(*)::bigint AS count
    FROM "Game" g
    LEFT JOIN "Script" s ON s."id" = g."script_id"
    WHERE ${baseWhere}
      AND g."script" IS NOT NULL
      AND g."script" != ''
    GROUP BY g."script", s."logo"
    ORDER BY count DESC
    LIMIT 5
  `);

  const most_common_scripts = scriptRows.map((r) => ({
    script: r.script,
    logo: r.logo,
    count: Number(r.count),
  }));

  // 9. Most common storytold scripts (top 5)
  const stScriptRows = await prisma.$queryRawUnsafe<
    { script: string; logo: string | null; count: bigint }[]
  >(`
    SELECT
      g."script",
      s."logo",
      COUNT(*)::bigint AS count
    FROM "Game" g
    LEFT JOIN "Script" s ON s."id" = g."script_id"
    WHERE ${baseWhere}
      AND ${isStorytellerExpr}
      AND g."script" IS NOT NULL
      AND g."script" != ''
    GROUP BY g."script", s."logo"
    ORDER BY count DESC
    LIMIT 5
  `);

  const most_common_storytold_scripts = stScriptRows.map((r) => ({
    script: r.script,
    logo: r.logo,
    count: Number(r.count),
  }));

  // 10. Most common communities
  const communityRows = await prisma.$queryRawUnsafe<
    { slug: string; icon: string; name: string; count: bigint }[]
  >(`
    SELECT
      c."slug",
      c."icon",
      c."name",
      COUNT(*)::bigint AS count
    FROM "Game" g
    JOIN "Community" c ON c."id" = g."community_id"
    WHERE ${baseWhere}
    GROUP BY c."slug", c."icon", c."name"
    ORDER BY count DESC
  `);

  const most_common_comunities = communityRows.map((r) => ({
    slug: r.slug,
    icon: r.icon,
    name: r.name,
    count: Number(r.count),
  }));

  // 11. Most common players (from last grimoire page tokens)
  const playerRows = await prisma.$queryRawUnsafe<
    {
      display_name: string;
      username: string | null;
      avatar: string | null;
      count: bigint;
    }[]
  >(`
    WITH last_page AS (
      SELECT gg."A" AS game_id, MAX(gg."B") AS grimoire_id
      FROM "_GameToGrimoire" gg
      JOIN "Game" g ON g."id" = gg."A"
      WHERE ${baseWhere}
      GROUP BY gg."A"
    ),
    page_tokens AS (
      SELECT
        lp.game_id,
        COALESCE(p."display_name", t."player_name") AS display_name,
        p."username",
        p."avatar"
      FROM last_page lp
      JOIN "Token" t ON t."grimoire_id" = lp.grimoire_id
      LEFT JOIN "UserSettings" p ON p."user_id" = t."player_id"
      WHERE (t."player_id" IS NOT NULL OR t."player_name" != '')
        AND t."player_name" != '${escapedUsername.replace(/'/g, "''")}'
        AND (p."username" IS NULL OR p."username" != '${escapedUsername}')
    )
    SELECT
      pt.display_name,
      pt.username,
      pt.avatar,
      COUNT(*)::bigint AS count
    FROM page_tokens pt
    GROUP BY COALESCE(pt.username, pt.display_name), pt.display_name, pt.username, pt.avatar
    ORDER BY count DESC
  `);

  const most_common_players = playerRows.map((r) => ({
    display_name: r.display_name,
    username: r.username,
    avatar: r.avatar,
    count: Number(r.count),
  }));

  // 12. Largest character change - games with >1 Character (scoped Prisma query)
  const characterChangeGames = await prisma.game.findMany({
    where: {
      deleted: false,
      user_id: userId,
      date: { gte: yearStart, lt: yearEnd },
      is_storyteller: false,
      NOT: {
        storyteller: `@${username}`,
      },
      player_characters: {
        // At least 2 characters with non-empty names
      },
    },
    select: {
      id: true,
      script: true,
      associated_script: {
        select: { logo: true },
      },
      player_characters: {
        include: {
          role: true,
          related_role: true,
        },
        where: { name: { not: "" } },
      },
    },
  });

  // Filter to only games with >1 character
  const multiCharGames = characterChangeGames.filter(
    (g) => g.player_characters.length > 1
  );

  let largest_character_change: {
    characters: typeof multiCharGames[0]["player_characters"];
    script: string;
    logo: string | null;
  } | null = null;

  for (const game of multiCharGames) {
    if (
      !largest_character_change ||
      game.player_characters.length >
        largest_character_change.characters.length
    ) {
      largest_character_change = {
        characters: game.player_characters as any,
        script: game.script,
        logo: game.associated_script?.logo ?? null,
      };
    }
  }

  // Keep the groupBy queries for averages (they're already efficient)
  const groupGames = await prisma.game.groupBy({
    by: ["user_id"],
    where: {
      deleted: false,
      date: { gte: yearStart, lt: yearEnd },
    },
    _count: { id: true },
  });

  const average_games_played =
    groupGames.length > 0
      ? groupGames.reduce((acc, g) => acc + g._count.id, 0) / groupGames.length
      : 0;

  const usernames = await prisma.userSettings
    .findMany({
      where: {
        games: {
          some: {
            date: { gte: yearStart, lt: yearEnd },
          },
        },
      },
      select: { username: true },
    })
    .then((u) => u.map((s) => s.username));

  const groupStorytoldGames = await prisma.game.groupBy({
    by: ["user_id"],
    where: {
      deleted: false,
      OR: [
        { is_storyteller: true },
        { storyteller: { in: usernames.map((u) => `@${u}`) } },
        { co_storytellers: { hasSome: usernames.map((u) => `@${u}`) } },
      ],
      date: { gte: yearStart, lt: yearEnd },
    },
    _count: { id: true },
  });

  const average_games_storytold =
    groupStorytoldGames.length > 0
      ? groupStorytoldGames.reduce((acc, g) => acc + g._count.id, 0) /
        groupStorytoldGames.length
      : 0;

  return {
    username: yearInReview.user.username,
    display_name: yearInReview.user.display_name,
    avatar: yearInReview.user.avatar,
    year: yearInReview.year,
    games_played,
    average_games_played,
    games_storytold,
    average_games_storytold,
    roles,
    related_roles,
    largest_character_change,
    win_rate,
    win_rate_good,
    win_rate_evil,
    loss_rate,
    role_types,
    winning_roles,
    losing_roles,
    games_by_month,
    most_common_storytold_scripts,
    most_common_scripts,
    most_common_players,
  };
});
