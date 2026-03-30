import type { AppUpdateDefinition } from "./types";
import { Prisma } from "~/server/generated/prisma/client";
import { generateEventsForMissingGames } from "~/server/utils/generateGrimoireEvents";

const DEFAULT_BATCH_SIZE = 200;

/**
 * Production backfill pass:
 * - Iterates all games in batches.
 * - Regenerates grimoire events from page/token diffs.
 * - Persists missing grimoire_participant_id values on tokens as needed.
 * - Replaces existing grimoire events for each processed game.
 */
export const grimoireEventsBackfillUpdate: AppUpdateDefinition = {
  id: "20260329_regenerate_all_grimoire_events",
  description:
    "Regenerate grimoire events in batches for all games.",
  async run(ctx) {
    const batchSize = Math.max(1, ctx.options.batchSize || DEFAULT_BATCH_SIZE);
    const maxToProcess =
      ctx.options.limit && ctx.options.limit > 0
        ? ctx.options.limit
        : Number.POSITIVE_INFINITY;

    let cursor = ctx.initialCursor;
    const countWhere: Prisma.GameWhereInput = cursor
      ? { id: { gt: cursor } }
      : {};
    const remainingCount = await ctx.prisma.game.count({ where: countWhere });
    const totalToProcess = Number.isFinite(maxToProcess)
      ? Math.min(remainingCount, maxToProcess)
      : remainingCount;

    let processed = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    await ctx.checkpoint({
      processed,
      updated,
      failed,
      skipped,
      cursor,
      total_to_process: totalToProcess,
      errors: [],
    }, cursor);

    while (processed < maxToProcess) {
      const remaining = maxToProcess - processed;
      const take = Math.min(batchSize, remaining);
      const where: Prisma.GameWhereInput = cursor
        ? { id: { gt: cursor } }
        : {};

      const games = await ctx.prisma.game.findMany({
        where,
        orderBy: { id: "asc" },
        take,
        select: {
          id: true,
          grimoire: {
            orderBy: [{ id: "asc" }],
            select: {
              id: true,
              tokens: {
                orderBy: [{ order: "asc" }],
                select: {
                  id: true,
                  order: true,
                  player_name: true,
                  player_id: true,
                  role_id: true,
                  related_role_id: true,
                  alignment: true,
                  is_dead: true,
                  grimoire_participant_id: true,
                  role: { select: { name: true } },
                  reminders: {
                    select: {
                      reminder: true,
                      token_url: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (games.length === 0) break;

      for (const game of games) {
        cursor = game.id;
        processed += 1;

        try {
          const generated = generateEventsForMissingGames(game.grimoire);

          if (!ctx.options.dryRun) {
            await ctx.prisma.$transaction(async (tx) => {
              for (const tokenUpdate of generated.tokenParticipantUpdates) {
                await tx.token.update({
                  where: { id: tokenUpdate.tokenId },
                  data: {
                    grimoire_participant_id: tokenUpdate.participantId,
                  },
                });
              }

              await tx.grimoireEvent.deleteMany({
                where: { game_id: game.id },
              });

              if (generated.events.length > 0) {
                await tx.grimoireEvent.createMany({
                  data: generated.events.map((event) => ({
                    game_id: game.id,
                    grimoire_page: event.grimoire_page,
                    participant_id: event.participant_id,
                    event_type: event.event_type,
                    status_source: event.status_source,
                    cause: event.cause,
                    by_participant_id: event.by_participant_id,
                    player_name: event.player_name,
                    role_id: event.role_id,
                    by_role_id: event.by_role_id,
                    old_role_id: event.old_role_id,
                    new_role_id: event.new_role_id,
                    old_alignment: event.old_alignment,
                    new_alignment: event.new_alignment,
                  })),
                });
              }
            });
          }

          if (generated.events.length === 0) {
            skipped += 1;
          } else {
            updated += 1;
          }
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`game ${game.id}: ${message}`);
        }
      }

      await ctx.checkpoint(
        {
          processed,
          updated,
          failed,
          skipped,
          cursor,
          total_to_process: totalToProcess,
          errors: errors.slice(-50),
        },
        cursor
      );

      ctx.log("Batch processed", {
        processed,
        updated,
        skipped,
        failed,
        cursor,
      });
    }

    return {
      processed,
      updated,
      failed,
      skipped,
      cursor,
      errors: errors.slice(-200),
    };
  },
};
