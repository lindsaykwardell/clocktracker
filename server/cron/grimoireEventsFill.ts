import { defineCronHandler } from "#nuxt/cron";
import { performLockedTask } from "../utils/cronLock";
import {
  fillMissingGrimoireEvents,
  grimoireEventsFillMode,
} from "../utils/fillMissingGrimoireEvents";
import { catchUpGrimoireEvents } from "../utils/grimoireEventsCatchUp";

// Generates grimoire events for games recorded before the feature existed,
// a batch at a time. Once none are left, it catches up games whose events
// predate reminder rules added later (server/utils/grimoireEventsCatchUp.ts).
// Set GRIMOIRE_EVENTS_BACKFILL=dry-run to log what one batch of each would do
// without writing, and =on to run it. Off by default.
//
// Each run stays well inside the cron lock's 5-minute stale window.
let dryRunReported = false;

export default defineCronHandler(
  "everyFiveMinutes",
  async () => {
    const mode = grimoireEventsFillMode();
    if (mode === "off") return;
    if (mode === "dry-run" && dryRunReported) return;

    await performLockedTask("grimoire_events_fill", async (prisma) => {
      const result = await fillMissingGrimoireEvents(prisma, {
        dryRun: mode === "dry-run",
      });
      if (result.examined > 0 || result.remaining > 0) {
        console.log(`[grimoire-events-fill] ${JSON.stringify(result)}`);
      }

      // Catch up only once the fill is done (or in a dry run, alongside it),
      // so one run never does both kinds of work on a busy batch.
      if (mode === "on" && result.remaining > 0) return;
      // A shorter budget, so fill and catch-up together stay inside the lock.
      const catchUp = await catchUpGrimoireEvents(prisma, {
        dryRun: mode === "dry-run",
        timeBudgetMs: 90 * 1000,
      });
      if (mode === "dry-run") dryRunReported = true;
      if (catchUp.examined === 0 && catchUp.remaining === 0) return;
      console.log(`[grimoire-events-catch-up] ${JSON.stringify(catchUp)}`);
    });
  },
  {
    runOnInit: true,
  }
);
