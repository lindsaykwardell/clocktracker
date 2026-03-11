import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  if (!(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  // Find all circular parent_game_id pairs (A->B and B->A)
  // a.id < b.id deduplicates so each pair appears once
  const pairs = await prisma.$queryRaw<
    {
      a_id: string;
      a_date: Date;
      a_script: string;
      a_user_id: string;
      a_username: string;
      a_display_name: string;
      a_is_storyteller: boolean;
      a_created_at: Date | null;
      a_child_count: bigint;
      b_id: string;
      b_date: Date;
      b_script: string;
      b_user_id: string;
      b_username: string;
      b_display_name: string;
      b_is_storyteller: boolean;
      b_created_at: Date | null;
      b_child_count: bigint;
    }[]
  >`
    SELECT
      a.id AS a_id,
      a.date AS a_date,
      a.script AS a_script,
      a.user_id AS a_user_id,
      ua.username AS a_username,
      ua.display_name AS a_display_name,
      a.is_storyteller AS a_is_storyteller,
      a.created_at AS a_created_at,
      (SELECT COUNT(*)::bigint FROM "Game" c WHERE c.parent_game_id = a.id AND c.deleted = false) AS a_child_count,
      b.id AS b_id,
      b.date AS b_date,
      b.script AS b_script,
      b.user_id AS b_user_id,
      ub.username AS b_username,
      ub.display_name AS b_display_name,
      b.is_storyteller AS b_is_storyteller,
      b.created_at AS b_created_at,
      (SELECT COUNT(*)::bigint FROM "Game" c WHERE c.parent_game_id = b.id AND c.deleted = false) AS b_child_count
    FROM "Game" a
    JOIN "Game" b ON a.parent_game_id = b.id AND b.parent_game_id = a.id
    JOIN "UserSettings" ua ON ua.user_id = a.user_id
    JOIN "UserSettings" ub ON ub.user_id = b.user_id
    WHERE a.id < b.id
      AND a.deleted = false
      AND b.deleted = false
    ORDER BY a.created_at DESC NULLS LAST
  `;

  return pairs.map((row) => ({
    gameA: {
      id: row.a_id,
      date: row.a_date,
      script: row.a_script,
      user_id: row.a_user_id,
      username: row.a_username,
      display_name: row.a_display_name,
      is_storyteller: row.a_is_storyteller,
      created_at: row.a_created_at,
      child_count: Number(row.a_child_count),
    },
    gameB: {
      id: row.b_id,
      date: row.b_date,
      script: row.b_script,
      user_id: row.b_user_id,
      username: row.b_username,
      display_name: row.b_display_name,
      is_storyteller: row.b_is_storyteller,
      created_at: row.b_created_at,
      child_count: Number(row.b_child_count),
    },
  }));
});
