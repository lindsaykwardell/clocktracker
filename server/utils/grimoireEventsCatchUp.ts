import type { Prisma, PrismaClient } from "~/server/generated/prisma/client";
import { generateEventsForMissingGames } from "~/server/utils/generateGrimoireEvents";
import { isSeatMovingScript } from "~/utils/grimoireChecks";
import { loadReminderCatalogFor } from "~/server/utils/fillMissingGrimoireEvents";
import {
  GRIMOIRE_EVENTS_VERSION,
  catchUpEvents,
  pendingCatchUpRules,
} from "~/server/utils/grimoireEventsCatchUps";

/**
 * Catch-up for reminder rules added after games already had their events.
 *
 * The background fill handles each game once, and an editor save stores the
 * events the editor made with the rules it knew. A rule added later only
 * reaches games whose grimoire is saved again. A catch-up adds the events of
 * the rules listed for it to every game that is behind, and nothing else.
 *
 * Safety rules:
 * - Only games that already had events generated or saved are considered
 *   (games the fill hasn't reached get every rule from the fill itself).
 * - Each catch-up runs once per game: `Game.grimoire_events_version` records
 *   the last one applied. After that, a user may delete one of its events on
 *   purpose, and a second run would bring it back.
 * - Events are only ever added, never changed or deleted, and only the
 *   listed rules' events. One already stored on the same page, player,
 *   reminder and source isn't added twice.
 * - Each game is claimed and written in one transaction, so a user saving the
 *   same game at the same time wins (the save marks it as caught up).
 *
 * The rules per catch-up are in server/utils/grimoireEventsCatchUps.ts.
 */

export type GrimoireEventsCatchUpResult = {
  examined: number;
  gamesWithNewEvents: number;
  eventsCreated: number;
  skippedConcurrentSave: number;
  failed: number;
  remaining: number;
  durationMs: number;
  dryRun: boolean;
};

// Games that threw during this server's lifetime; retried after a restart.
const failedGameIds = new Set<string>();
const MAX_TRACKED_FAILURES = 1000;

export async function catchUpGrimoireEvents(
  prisma: PrismaClient,
  options: {
    batchSize?: number;
    timeBudgetMs?: number;
    dryRun?: boolean;
    /** Only games recorded by this user (the admin tool). */
    userId?: string;
  } = {}
): Promise<GrimoireEventsCatchUpResult> {
  const batchSize = options.batchSize ?? 300;
  const timeBudgetMs = options.timeBudgetMs ?? 2 * 60 * 1000;
  const dryRun = options.dryRun ?? false;
  const startedAt = Date.now();

  const result: GrimoireEventsCatchUpResult = {
    examined: 0,
    gamesWithNewEvents: 0,
    eventsCreated: 0,
    skippedConcurrentSave: 0,
    failed: 0,
    remaining: 0,
    durationMs: 0,
    dryRun,
  };

  const behind: Prisma.GameWhereInput = {
    // Null: the fill hasn't reached the game, and gives it every rule itself.
    grimoire_events_version: { not: null, lt: GRIMOIRE_EVENTS_VERSION },
    deleted: false,
    ...(options.userId ? { user_id: options.userId } : {}),
    ...(failedGameIds.size ? { id: { notIn: [...failedGameIds] } } : {}),
  };

  const games = await prisma.game.findMany({
    where: behind,
    orderBy: { id: "asc" },
    take: batchSize,
    select: {
      id: true,
      script: true,
      grimoire_events_version: true,
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
      const rules = pendingCatchUpRules(game.grimoire_events_version ?? 0);
      // Tokens without a participant id get a new one in the generator; their
      // events can't match a stored event, and the fill owns filling ids in.
      // Leave such tokens' events out rather than store events for ids that
      // no token has.
      const knownParticipants = new Set(
        game.grimoire.flatMap((page) =>
          page.tokens.map((token) => token.grimoire_participant_id).filter(Boolean)
        )
      );
      // Musical Chairs games get no events (see fillMissingGrimoireEvents),
      // so nothing to catch up either; they're still marked as up to date.
      const generated = isSeatMovingScript(game.script)
        ? []
        : generateEventsForMissingGames(game.grimoire, catalog, {
            script: game.script,
          }).events.filter((event) => knownParticipants.has(event.participant_id));

      const outcome = await prisma.$transaction(async (tx) => {
        const existing = await tx.grimoireEvent.findMany({
          where: { game_id: game.id },
          select: {
            grimoire_page: true,
            participant_id: true,
            event_type: true,
            status_source: true,
            by_role_id: true,
          },
        });
        const toAdd = catchUpEvents(generated, existing, rules);
        if (dryRun) return { added: toAdd.length };

        // Claim the game. If an editor save marked it in the meantime, leave it alone.
        const claimed = await tx.game.updateMany({
          where: { id: game.id, grimoire_events_version: game.grimoire_events_version },
          data: { grimoire_events_version: GRIMOIRE_EVENTS_VERSION },
        });
        if (claimed.count === 0) return "skipped" as const;

        if (toAdd.length > 0) {
          await tx.grimoireEvent.createMany({
            data: toAdd.map((event) => ({
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
        return { added: toAdd.length };
      });

      if (outcome === "skipped") {
        result.skippedConcurrentSave += 1;
      } else {
        result.eventsCreated += outcome.added;
        if (outcome.added > 0) result.gamesWithNewEvents += 1;
      }
    } catch (error) {
      result.failed += 1;
      if (failedGameIds.size < MAX_TRACKED_FAILURES) failedGameIds.add(game.id);
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[grimoire-events-catch-up] game ${game.id} failed: ${message}`);
    }
  }

  result.remaining = await prisma.game.count({ where: behind });
  result.durationMs = Date.now() - startedAt;
  return result;
}
