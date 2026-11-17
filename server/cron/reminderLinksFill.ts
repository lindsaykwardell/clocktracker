import { defineCronHandler } from "#nuxt/cron";
import { performLockedTask } from "../utils/cronLock";
import {
  fillReminderLinks,
  reminderLinkFillMode,
} from "../utils/fillReminderLinks";

// Links reminders saved before catalog linking existed to the reminder
// catalog, a batch at a time. Set REMINDER_LINK_BACKFILL=dry-run to log what
// one batch would do without writing, and =on to run it. Off by default.
//
// Each run stays well inside the cron lock's 5-minute stale window.
let dryRunReported = false;

export default defineCronHandler(
  "everyFiveMinutes",
  async () => {
    const mode = reminderLinkFillMode();
    if (mode === "off") return;
    if (mode === "dry-run" && dryRunReported) return;

    await performLockedTask("reminder_links_fill", async (prisma) => {
      const result = await fillReminderLinks(prisma, {
        dryRun: mode === "dry-run",
      });
      if (mode === "dry-run") dryRunReported = true;
      if (result.examined === 0) return;
      console.log(`[reminder-links-fill] ${JSON.stringify(result)}`);
    });
  },
  {
    runOnInit: true,
  }
);
