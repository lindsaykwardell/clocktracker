import { Prisma } from "~/server/generated/prisma/client";
import dayjs from "dayjs";
import type { GameRecord } from "~/composables/useGames";
import {
  buildGlobalRoleStatCardPreview,
  getRoleCardDefinitions,
} from "~/composables/useRoleStatCards";
import { prisma } from "~/server/utils/prisma";

function scriptKey(scriptId: number | null, scriptName: string | null) {
  return `${scriptId ?? "custom"}:${scriptName ?? ""}`;
}

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

  const roleOccurrenceRows = await prisma.$queryRaw<
    {
      game_id: string;
      script_id: number | null;
      script: string | null;
      date: Date;
      alignment: "GOOD" | "EVIL" | "NEUTRAL";
      win_v2: string;
      end_trigger_role_id: string | null;
      end_trigger_cause: string | null;
    }[]
  >(Prisma.sql`
    WITH last_player_char AS (
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
        AND c."role_id" = ${role_id}
      ORDER BY c."game_id", c."id" DESC
    ),
    last_grimoire_page AS (
      SELECT gg."A" AS game_id, MAX(gg."B") AS grimoire_id
      FROM "_GameToGrimoire" gg
      JOIN "Game" g ON g."id" = gg."A"
      WHERE g."deleted" = false
        AND g."parent_game_id" IS NULL
        AND g."ignore_for_stats" = false
        AND g."is_storyteller" = true
      GROUP BY gg."A"
    ),
    storyteller_tokens AS (
      SELECT
        lgp.game_id,
        t."role_id",
        t."alignment"
      FROM last_grimoire_page lgp
      JOIN "Token" t ON t."grimoire_id" = lgp.grimoire_id
      WHERE t."role_id" = ${role_id}
    ),
    role_entries AS (
      SELECT game_id, role_id, alignment FROM last_player_char
      UNION ALL
      SELECT game_id, role_id, alignment FROM storyteller_tokens
    )
    SELECT
      re.game_id,
      g."script_id",
      g."script",
      g."date",
      re.alignment,
      g."win_v2"::text AS win_v2,
      g."end_trigger_role_id",
      g."end_trigger_cause"::text AS end_trigger_cause
    FROM role_entries re
    JOIN "Game" g ON g."id" = re.game_id
  `);

  const totalCount = roleOccurrenceRows.length;

  // Compute overall win/loss by summing across all scripts
  let totalWins = 0;
  let totalLosses = 0;
  const winRateByScript = new Map<string, { wins: number; losses: number }>();
  const popularScripts = new Map<
    string,
    {
      script_id: number | null;
      script: string | null;
      count: number;
      ability_endings: number;
    }
  >();

  for (const row of roleOccurrenceRows) {
    const key = scriptKey(row.script_id, row.script);
    const scriptEntry = popularScripts.get(key) ?? {
      script_id: row.script_id,
      script: row.script,
      count: 0,
      ability_endings: 0,
    };
    scriptEntry.count += 1;
    if (
      row.end_trigger_role_id === role_id &&
      row.end_trigger_cause === "ABILITY"
    ) {
      scriptEntry.ability_endings += 1;
    }
    popularScripts.set(key, scriptEntry);

    if (row.win_v2 === "NOT_RECORDED") continue;

    const didWin =
      (row.alignment === "GOOD" && row.win_v2 === "GOOD_WINS") ||
      (row.alignment === "EVIL" && row.win_v2 === "EVIL_WINS");
    const rates = winRateByScript.get(key) ?? { wins: 0, losses: 0 };

    if (didWin) {
      totalWins += 1;
      rates.wins += 1;
    } else {
      totalLosses += 1;
      rates.losses += 1;
    }

    winRateByScript.set(key, rates);
  }

  const winLossTotal = totalWins + totalLosses;

  // Build games_by_month
  const months = Array.from(Array(12).keys())
    .map((i) => dayjs().subtract(i, "month").format("MMMM"))
    .reverse();

  const games_by_month: Record<string, number> = Object.fromEntries(
    months.map((month) => [month, 0])
  );

  for (const game of roleOccurrenceRows) {
    if (dayjs(game.date).isBefore(dayjs().subtract(12, "month"))) continue;

    const month = dayjs(game.date).format("MMMM");
    if (month in games_by_month) {
      games_by_month[month]++;
    }
  }

  // Batch fetch script metadata (instead of N+1 findUnique per script)
  const popular_scripts = Array.from(popularScripts.values())
    .filter((script) => script.script)
    .sort((a, b) => b.count - a.count || (a.script ?? "").localeCompare(b.script ?? ""))
    .slice(0, 10);

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
    const rates = winRateByScript.get(scriptKey(script.script_id, script.script)) ?? {
      wins: 0,
      losses: 0,
    };
    const scriptTotal = rates.wins + rates.losses;
    const pct =
      scriptTotal === 0 ? 0 : +((rates.wins / scriptTotal) * 100).toFixed(2);

    return {
      script_id: script.script_id,
      script: script.script!,
      version: meta?.version ?? null,
      custom_script_id: meta?.is_custom_script ? meta.script_id : null,
      logo: meta?.logo ?? null,
      wins: rates.wins,
      pct,
      count: script.count,
      ability_endings: script.ability_endings,
    };
  });

  const roleCardDefinitions = getRoleCardDefinitions(role_id, "global");
  const needsGrimoireState = roleCardDefinitions.some((definition) =>
    definition.globalDataNeeds?.includes("grimoire_state")
  );
  const needsEndTriggerRole = roleCardDefinitions.some((definition) =>
    definition.globalDataNeeds?.includes("end_trigger_role")
  );
  const roleStatGames = roleCardDefinitions.length
    ? await prisma.game.findMany({
        where: {
          deleted: false,
          parent_game_id: null,
          ignore_for_stats: false,
          OR: [
            {
              end_trigger_role_id: role_id,
            },
            {
              grimoire_events: {
                some: {
                  by_role_id: role_id,
                },
              },
            },
            {
              grimoire_events: {
                some: {
                  role_id,
                },
              },
            },
            {
              grimoire_events: {
                some: {
                  old_role_id: role_id,
                },
              },
            },
            {
              grimoire_events: {
                some: {
                  new_role_id: role_id,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          ignore_for_stats: true,
          win_v2: true,
          end_trigger: true,
          end_trigger_type: true,
          end_trigger_cause: true,
          end_trigger_role_id: true,
          end_trigger_participant_alignment: true,
          end_trigger_subtype: true,
          end_trigger_note: true,
          grimoire_events: {
            select: {
              grimoire_page: true,
              participant_id: true,
              event_type: true,
              status_source: true,
              cause: true,
              by_participant_id: true,
              role_id: true,
              by_role_id: true,
              old_role_id: true,
              new_role_id: true,
              old_alignment: true,
              new_alignment: true,
            },
          },
          end_trigger_role: needsEndTriggerRole
            ? {
                select: {
                  id: true,
                  token_url: true,
                  type: true,
                  initial_alignment: true,
                  name: true,
                },
              }
            : false,
          grimoire: {
            ...(needsGrimoireState
              ? {
                  select: {
                    tokens: {
                      orderBy: {
                        order: "asc",
                      },
                      select: {
                        grimoire_participant_id: true,
                        role_id: true,
                        alignment: true,
                        order: true,
                        role: {
                          select: {
                            id: true,
                            token_url: true,
                            type: true,
                            initial_alignment: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    id: "asc",
                  },
                }
              : {
                  select: {
                    id: true,
                  },
                  take: 0,
                }),
          },
        },
      })
    : [];

  const role_stat_cards = roleCardDefinitions
    .map((definition) =>
      buildGlobalRoleStatCardPreview(
        definition.id,
        roleStatGames as unknown as GameRecord[],
        role
      )
    )
    .filter((card): card is NonNullable<typeof card> => !!card);

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
    role_stat_cards,
  };
});
