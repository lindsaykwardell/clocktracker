import { defineCronHandler } from "#nuxt/cron";
import { performLockedTask } from "../utils/cronLock";
import { importScripts } from "../utils/importScripts";

export default defineCronHandler(
  "daily",
  async () =>
    performLockedTask("script_import", async (prisma) => {
      console.log("Starting script import...");
      await importScripts(prisma);
      console.log("Done!");
    }),
  {
    timeZone: "America/New_York",
    runOnInit: false,
  }
);
