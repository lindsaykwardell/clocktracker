import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { hasPermission } from "~/server/utils/permissions";
import { prisma } from "~/server/utils/prisma";
import {
  gamesWithoutEventsWhere,
  grimoireEventsFillMode,
} from "~/server/utils/fillMissingGrimoireEvents";
import { gamesBehindCatchUpWhere } from "~/server/utils/grimoireEventsCatchUp";
import {
  countUnlinkedReminders,
  reminderLinkFillMode,
} from "~/server/utils/fillReminderLinks";

// Read-only status of the background data jobs in server/cron/: the setting
// that controls each one, and how much work is left. Starting and stopping
// them stays with the environment variables.
//
// "running" means the job's cron lock is held. performLockedTask keeps the
// lock for a minute after a run, so it can show for up to a minute more.
// The fill and the catch-up share one lock, "grimoire_events_fill".

const STALE_LOCK_MS = 5 * 60 * 1000; // Same window as server/utils/cronLock.ts.

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "MANAGE_APP_TOOLS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const [withoutEvents, behindCatchUp, unlinkedReminders, locks] =
    await Promise.all([
      prisma.game.count({ where: gamesWithoutEventsWhere() }),
      prisma.game.count({ where: gamesBehindCatchUpWhere() }),
      countUnlinkedReminders(prisma),
      prisma.cronLock.findMany({
        where: { task_id: { in: ["grimoire_events_fill", "reminder_links_fill"] } },
      }),
    ]);

  const isRunning = (taskId: string) =>
    locks.some(
      (lock) =>
        lock.task_id === taskId &&
        Date.now() - lock.created_at.getTime() < STALE_LOCK_MS
    );

  const eventsMode = grimoireEventsFillMode();

  return {
    // performLockedTask never runs a job on staging, whatever the setting.
    staging: process.env.STAGING === "true",
    jobs: [
      {
        id: "grimoire_events_fill",
        setting: "GRIMOIRE_EVENTS_BACKFILL",
        mode: eventsMode,
        remaining: withoutEvents,
        unit: "games",
        running: isRunning("grimoire_events_fill"),
      },
      {
        id: "grimoire_events_catch_up",
        setting: "GRIMOIRE_EVENTS_BACKFILL",
        mode: eventsMode,
        remaining: behindCatchUp,
        unit: "games",
        running: isRunning("grimoire_events_fill"),
        // When on, the catch-up only starts once the fill has nothing left.
        waitingForFill: eventsMode === "on" && withoutEvents > 0,
      },
      {
        id: "reminder_links_fill",
        setting: "REMINDER_LINK_BACKFILL",
        mode: reminderLinkFillMode(),
        remaining: unlinkedReminders,
        unit: "reminders",
        running: isRunning("reminder_links_fill"),
      },
    ],
  };
});
