import { defineCronHandler } from "#nuxt/cron";
import { performLockedTask } from "../utils/cronLock";
import {
  fillMissingGrimoireEvents,
  grimoireEventsFillMode,
} from "../utils/fillMissingGrimoireEvents";

// Generates grimoire events for games recorded before the feature existed,
// a batch at a time. Set GRIMOIRE_EVENTS_BACKFILL=dry-run to log what one
// batch would do without writing, and =on to run it. Off by default.
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
      if (mode === "dry-run") dryRunReported = true;
      if (result.examined === 0 && result.remaining === 0) return;
      console.log(`[grimoire-events-fill] ${JSON.stringify(result)}`);
    });
  },
  {
    runOnInit: true,
  }
);
