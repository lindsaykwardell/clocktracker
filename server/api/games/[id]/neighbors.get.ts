import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { gameNavigationCharacter } from "~/shared/gameNavigation";

type NeighborRow = {
  id: string;
  date: Date;
  script: string | null;
  is_storyteller: boolean;
  character_name: string | null;
  character_alignment: string | null;
  position: bigint;
  total: bigint;
};

/**
 * The games before and after one of your own games, newest first, in the same
 * order as the games overview sorted by date. For a game page you reached
 * without the overview. Only your own games, so no privacy rules come into it.
 */
export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const gameId = handler.context.params?.id;

  if (!gameId) {
    throw createError({ status: 400, statusMessage: "Bad Request" });
  }
  if (!me) return null;

  // Numbers the user's games in order and takes the game with the one on
  // either side of it, each with the last character played (the highest id,
  // as the game page shows it). Nothing comes back when it isn't one of
  // their games.
  const rows = await prisma.$queryRaw<NeighborRow[]>`
    WITH ordered AS (
      SELECT "id", "date", "script", "is_storyteller",
        ROW_NUMBER() OVER (
          ORDER BY "date" DESC, "created_at" DESC NULLS LAST, "id" DESC
        ) AS position,
        COUNT(*) OVER () AS total
      FROM "Game"
      WHERE "user_id" = ${me.id}
        AND "deleted" = false
        AND "waiting_for_confirmation" = false
    ),
    current AS (
      SELECT position FROM ordered WHERE "id" = ${gameId}
    )
    SELECT o."id", o."date", o."script", o."is_storyteller",
      last_character."name" AS character_name,
      last_character."alignment"::text AS character_alignment,
      o.position, o.total
    FROM ordered o
    CROSS JOIN current c
    LEFT JOIN LATERAL (
      SELECT "name", "alignment" FROM "Character"
      WHERE "game_id" = o."id"
      ORDER BY "id" DESC
      LIMIT 1
    ) last_character ON true
    WHERE o.position BETWEEN c.position - 1 AND c.position + 1
    ORDER BY o.position
  `;

  const index = rows.findIndex((row) => row.id === gameId);
  if (index === -1) return null;

  const entry = (row: NeighborRow | undefined) =>
    row
      ? {
          id: row.id,
          date: row.date.toISOString(),
          script: row.script || null,
          ...gameNavigationCharacter(row.is_storyteller, {
            name: row.character_name,
            alignment: row.character_alignment,
          }),
        }
      : null;

  return {
    position: Number(rows[index].position),
    total: Number(rows[index].total),
    previous: entry(rows[index - 1]),
    next: entry(rows[index + 1]),
  };
});
