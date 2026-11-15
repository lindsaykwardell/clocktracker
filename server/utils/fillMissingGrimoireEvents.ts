import { Prisma, type PrismaClient } from "~/server/generated/prisma/client";
import { generateEventsForMissingGames } from "~/server/utils/generateGrimoireEvents";

/**
 * Background fill for games that have never had grimoire events generated
 * (games recorded before the feature existed).
 *
 * Safety rules:
 * - Only games with `grimoire_events_generated_at = null` are considered.
 *   Editor saves set that column, so anything a user has saved is skipped.
 * - A game that already has events is only marked, never regenerated.
 * - Events are only ever added; nothing is deleted.
 * - Missing token participant ids are filled in; existing ones are kept.
 * - Each game is claimed and written in one transaction, so a user saving the
 *   same game at the same time wins.
 */

export type GrimoireEventsFillMode = "off" | "dry-run" | "on";

/** Controlled by GRIMOIRE_EVENTS_BACKFILL ("on" | "dry-run"); anything else is off. */
export function grimoireEventsFillMode(): GrimoireEventsFillMode {
  const value = (process.env.GRIMOIRE_EVENTS_BACKFILL ?? "").trim().toLowerCase();
  if (value === "on") return "on";
  if (value === "dry-run") return "dry-run";
  return "off";
}

export type GrimoireEventsFillResult = {
  examined: number;
  filled: number;
  eventsCreated: number;
  participantIdsFilled: number;
  alreadyHadEvents: number;
  noEvents: number;
  skippedConcurrentSave: number;
  failed: number;
  remaining: number;
  durationMs: number;
  dryRun: boolean;
};

// Games that threw during this server's lifetime. They are retried after a
// restart, but are not allowed to clog every batch until then.
const failedGameIds = new Set<string>();
const MAX_TRACKED_FAILURES = 1000;

export async function fillMissingGrimoireEvents(
  prisma: PrismaClient,
  options: { batchSize?: number; timeBudgetMs?: number; dryRun?: boolean } = {}
): Promise<GrimoireEventsFillResult> {
  const batchSize = options.batchSize ?? 300;
  const timeBudgetMs = options.timeBudgetMs ?? 2 * 60 * 1000;
  const dryRun = options.dryRun ?? false;
  const startedAt = Date.now();

  const result: GrimoireEventsFillResult = {
    examined: 0,
    filled: 0,
    eventsCreated: 0,
    participantIdsFilled: 0,
    alreadyHadEvents: 0,
    noEvents: 0,
    skippedConcurrentSave: 0,
    failed: 0,
    remaining: 0,
    durationMs: 0,
    dryRun,
  };

  const unprocessed: Prisma.GameWhereInput = {
    grimoire_events_generated_at: null,
    deleted: false,
    ...(failedGameIds.size ? { id: { notIn: [...failedGameIds] } } : {}),
  };

  const games = await prisma.game.findMany({
    where: unprocessed,
    orderBy: { id: "asc" },
    take: batchSize,
    select: {
      id: true,
      _count: { select: { grimoire_events: true } },
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

  for (const game of games) {
    if (Date.now() - startedAt > timeBudgetMs) break;
    result.examined += 1;

    try {
      if (game._count.grimoire_events > 0) {
        result.alreadyHadEvents += 1;
        if (!dryRun) await markGenerated(prisma, game.id);
        continue;
      }

      const generated = generateEventsForMissingGames(game.grimoire);

      if (dryRun) {
        if (generated.events.length === 0) result.noEvents += 1;
        else result.filled += 1;
        result.eventsCreated += generated.events.length;
        result.participantIdsFilled += generated.tokenParticipantUpdates.length;
        continue;
      }

      const outcome = await prisma.$transaction(async (tx) => {
        // Claim the game. If an editor save marked it in the meantime, leave it alone.
        const claimed = await tx.game.updateMany({
          where: { id: game.id, grimoire_events_generated_at: null },
          data: { grimoire_events_generated_at: new Date() },
        });
        if (claimed.count === 0) return "skipped" as const;

        // Belt and braces: never add generated events next to existing ones.
        const existing = await tx.grimoireEvent.count({ where: { game_id: game.id } });
        if (existing > 0) return "had-events" as const;

        let participantIdsFilled = 0;
        if (generated.tokenParticipantUpdates.length > 0) {
          participantIdsFilled = await tx.$executeRaw`
            UPDATE "Token" AS t
            SET "grimoire_participant_id" = v.participant_id
            FROM unnest(
              ${generated.tokenParticipantUpdates.map((u) => u.tokenId)}::int[],
              ${generated.tokenParticipantUpdates.map((u) => u.participantId)}::text[]
            ) AS v(token_id, participant_id)
            WHERE t."id" = v.token_id
              AND t."grimoire_participant_id" IS NULL
          `;
        }

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

        return { participantIdsFilled } as const;
      });

      if (outcome === "skipped") {
        result.skippedConcurrentSave += 1;
      } else if (outcome === "had-events") {
        result.alreadyHadEvents += 1;
      } else {
        result.participantIdsFilled += outcome.participantIdsFilled;
        result.eventsCreated += generated.events.length;
        if (generated.events.length === 0) result.noEvents += 1;
        else result.filled += 1;
      }
    } catch (error) {
      result.failed += 1;
      if (failedGameIds.size < MAX_TRACKED_FAILURES) failedGameIds.add(game.id);
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[grimoire-events-fill] game ${game.id} failed: ${message}`);
    }
  }

  result.remaining = await prisma.game.count({ where: unprocessed });
  result.durationMs = Date.now() - startedAt;
  return result;
}

async function markGenerated(prisma: PrismaClient, gameId: string) {
  await prisma.game.updateMany({
    where: { id: gameId, grimoire_events_generated_at: null },
    data: { grimoire_events_generated_at: new Date() },
  });
}
