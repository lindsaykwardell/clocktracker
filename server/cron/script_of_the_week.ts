import { defineCronHandler } from "#nuxt/cron";
import dayjs from "dayjs";
import { roleOfTheDay } from "../utils/roleOfTheDay";
import { AtpAgent, RichText } from "@atproto/api";
import { Alignment, WinStatus_V2 } from "@prisma/client";
import { performLockedTask } from "../utils/cronLock";
import scripts_of_the_weekGet from "../api/scripts_of_the_week.get";

const agent = new AtpAgent({
  service: "https://bsky.social",
});

export default defineCronHandler(
  "weekly",
  async () =>
    performLockedTask("script_of_the_week", async (prisma) => {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.BSKY_PASSWORD === undefined
      ) {
        return;
      }

      await agent.login({
        identifier: "clocktracker.app",
        password: process.env.BSKY_PASSWORD,
      });

      const scripts = await getScriptsOfTheWeek(prisma);

      if (scripts.length === 0) {
        return;
      }
    }),
  {
    timeZone: "America/New_York",
    runOnInit: true,
  }
);
