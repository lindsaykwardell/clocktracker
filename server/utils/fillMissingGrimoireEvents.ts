import { Prisma, type PrismaClient } from "~/server/generated/prisma/client";
import { generateEventsForMissingGames } from "~/server/utils/generateGrimoireEvents";
import { buildReminderCatalog, type ReminderCatalog } from "~/shared/reminderCatalog";
import { GRIMOIRE_EVENTS_VERSION } from "~/server/utils/grimoireEventsCatchUps";
import { saveGrimoireRevision } from "~/server/utils/grimoireRevision";
import { isSeatMovingScript } from "~/utils/grimoireChecks";
import {
  applySeatRepairs,
  planSeatRepairs,
  seatRepairMessage,
} from "~/server/utils/repairSeatNumbers";

/**
 * Background fill for games that have never had grimoire events generated
 * (games recorded before the feature existed).
 *
 * Safety rules:
 * - Only games with `grimoire_events_version = null` are considered.
 *   Editor saves set that column, so anything a user has saved is skipped.
 * - A game that already has events is only marked, never regenerated.
 * - Events are only ever added; nothing is deleted.
 * - Missing token participant ids are filled in; existing ones are kept.
 * - Pages with broken seat numbers (a seat twice, one missing) are repaired
 *   first when the neighbouring pages say for certain where everyone sits
 *   (server/utils/repairSeatNumbers.ts). The grimoire as it was is saved as
 *   a revision first, with a message, so "Restore from history" can undo it.
 * - Musical Chairs games get no events (players move between seats while
 *   everything else stays with the seat); they are only marked as done.
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
  /** Pages whose seat numbers were repaired, and pages left for a person to look at. */
  seatPagesRepaired: number;
  seatPagesUnrepaired: number;
  /** Musical Chairs games: marked as done without events (see below). */
  skippedSeatMovingScript: number;
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

/**
 * The catalog entries the reminders of these games point to (by link or by
 * icon), so the events can say exactly which role a reminder came from.
 */
export async function loadReminderCatalogFor(
  prisma: PrismaClient,
  games: {
    grimoire: {
      tokens: {
        reminders: { token_url: string; role_reminder_id: number | null }[];
      }[];
    }[];
  }[]
): Promise<ReminderCatalog> {
  const urls = new Set<string>();
  const ids = new Set<number>();
  for (const game of games) {
    for (const page of game.grimoire) {
      for (const token of page.tokens) {
        for (const reminder of token.reminders) {
          if (reminder.token_url) urls.add(reminder.token_url);
          if (reminder.role_reminder_id !== null) ids.add(reminder.role_reminder_id);
        }
      }
    }
  }
  if (urls.size === 0 && ids.size === 0) return buildReminderCatalog([]);

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { token_url: { in: [...urls] } },
        { reminders: { some: { id: { in: [...ids] } } } },
      ],
    },
    select: {
      id: true,
      token_url: true,
      custom_role: true,
      reminders: { select: { id: true, reminder: true } },
    },
  });
  return buildReminderCatalog(roles);
}

export async function fillMissingGrimoireEvents(
  prisma: PrismaClient,
  options: {
    batchSize?: number;
    timeBudgetMs?: number;
    dryRun?: boolean;
    /** Only fill games recorded by this user (the admin "fill for a user" tool). */
    userId?: string;
  } = {}
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
    seatPagesRepaired: 0,
    seatPagesUnrepaired: 0,
    skippedSeatMovingScript: 0,
    alreadyHadEvents: 0,
    noEvents: 0,
    skippedConcurrentSave: 0,
    failed: 0,
    remaining: 0,
    durationMs: 0,
    dryRun,
  };

  const unprocessed: Prisma.GameWhereInput = {
    grimoire_events_version: null,
    deleted: false,
    ...(options.userId ? { user_id: options.userId } : {}),
    ...(failedGameIds.size ? { id: { notIn: [...failedGameIds] } } : {}),
  };

  const games = await prisma.game.findMany({
    where: unprocessed,
    orderBy: { id: "asc" },
    take: batchSize,
    select: {
      id: true,
      script: true,
      _count: { select: { grimoire_events: true } },
      grimoire: {
        orderBy: [{ id: "asc" }],
        select: {
          id: true,
          page_type: true,
          lifetimes_applied: true,
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
                  role_reminder_id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const catalog = await loadReminderCatalogFor(prisma, games);

  for (const game of games) {
    if (Date.now() - startedAt > timeBudgetMs) break;
    result.examined += 1;

    try {
      if (game._count.grimoire_events > 0) {
        result.alreadyHadEvents += 1;
        if (!dryRun) await markGenerated(prisma, game.id);
        continue;
      }

      // Musical Chairs: the players move between seats while the characters,
      // shrouds and reminders stay put, which the events (about players)
      // can't follow yet. Marked as done, without events.
      if (isSeatMovingScript(game.script)) {
        result.skippedSeatMovingScript += 1;
        if (!dryRun) {
          // The current version: no catch-up rule applies to a game without events.
          await prisma.game.updateMany({
            where: { id: game.id, grimoire_events_version: null },
            data: { grimoire_events_version: GRIMOIRE_EVENTS_VERSION },
          });
        }
        continue;
      }

      // Broken seat numbers first, so the events see the right seats.
      const seatPlan = planSeatRepairs(game.grimoire, { script: game.script });
      for (const left of seatPlan.unrepaired) {
        console.warn(
          `[grimoire-events-fill] game ${game.id} page ${left.page + 1}: ${left.problem}; not repaired: ${left.reason}`
        );
      }
      applySeatRepairs(game.grimoire, seatPlan);
      const seatChanges = seatPlan.repairs.flatMap((repair) => repair.orders);

      const generated = generateEventsForMissingGames(game.grimoire, catalog, {
        script: game.script,
      });

      if (dryRun) {
        result.seatPagesRepaired += seatPlan.repairs.length;
        result.seatPagesUnrepaired += seatPlan.unrepaired.length;
        if (generated.events.length === 0) result.noEvents += 1;
        else result.filled += 1;
        result.eventsCreated += generated.events.length;
        result.participantIdsFilled += generated.tokenParticipantUpdates.length;
        continue;
      }

      const outcome = await prisma.$transaction(async (tx) => {
        // Claim the game. If an editor save marked it in the meantime, leave it alone.
        const claimed = await tx.game.updateMany({
          where: { id: game.id, grimoire_events_version: null },
          // Generated with every current rule, so no catch-up is needed.
          data: {
            grimoire_events_version: GRIMOIRE_EVENTS_VERSION,
          },
        });
        if (claimed.count === 0) return "skipped" as const;

        // Belt and braces: never add generated events next to existing ones.
        const existing = await tx.grimoireEvent.count({ where: { game_id: game.id } });
        if (existing > 0) return "had-events" as const;

        // Pages are shared with the game's copies (tagged players), so another
        // copy may have repaired them already: only tokens still on their old
        // seat change, and only then is a revision saved.
        let seatsRepaired = false;
        if (seatChanges.length > 0) {
          const current = await tx.token.findMany({
            where: { id: { in: seatChanges.map((change) => change.tokenId) } },
            select: { id: true, order: true },
          });
          const currentOrder = new Map(current.map((token) => [token.id, token.order]));
          const pending = seatChanges.filter(
            (change) => currentOrder.get(change.tokenId) === change.from
          );
          if (pending.length > 0) {
            await saveGrimoireRevision(tx, game.id, seatRepairMessage(seatPlan));
            await tx.$executeRaw`
              UPDATE "Token" AS t
              SET "order" = v.seat
              FROM unnest(
                ${pending.map((change) => change.tokenId)}::int[],
                ${pending.map((change) => change.to)}::int[]
              ) AS v(token_id, seat)
              WHERE t."id" = v.token_id
            `;
            seatsRepaired = true;
          }
        }

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

        return { participantIdsFilled, seatsRepaired } as const;
      });

      if (outcome === "skipped") {
        result.skippedConcurrentSave += 1;
      } else if (outcome === "had-events") {
        result.alreadyHadEvents += 1;
      } else {
        result.participantIdsFilled += outcome.participantIdsFilled;
        if (outcome.seatsRepaired) result.seatPagesRepaired += seatPlan.repairs.length;
        result.seatPagesUnrepaired += seatPlan.unrepaired.length;
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
    where: { id: gameId, grimoire_events_version: null },
    // Events saved before this column existed, by an editor that knew none of
    // the catch-up rules: version 0, so every catch-up still runs.
    data: { grimoire_events_version: 0 },
  });
}
