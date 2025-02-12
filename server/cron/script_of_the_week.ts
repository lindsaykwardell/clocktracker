import { defineCronHandler } from "#nuxt/cron";
import dayjs from "dayjs";
import { roleOfTheDay } from "../utils/roleOfTheDay";
import { AtpAgent, RichText } from "@atproto/api";
import { Alignment, WinStatus_V2 } from "@prisma/client";
import { performLockedTask } from "../utils/cronLock";

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

      // Translate the following SQL into a Prisma query
      /**
       * select
  script,
  "Game".script_id,
  count(*)
from
  "Game"
  left join "Script" on "Game".script_id = "Script".id
where
  parent_game_id is not null
  and (
    "Script".author is null
    or "Script".author != 'The Pandemonium Institute'
  )
  and script != ''
  and script != 'Custom'
  and to_char(created_at, 'YYYY-MM') = '2024-04'
group by
  script,
  "Game".script_id
order by
  count desc
limit
  5;
       */

      const games = await prisma.game.findMany({
        where: {
          parent_game_id: null,
          script: {
            not: "",
          },
          AND: {
            script: {
              not: "Custom",
            },
          },
          // associated_script: {
          //   author: {
          //     not: "The Pandemonium Institute",
          //   },
          // },
          created_at: {
            gte: dayjs().subtract(1, "week").toDate(),
          },
        },
        select: {
          script: true,
          script_id: true,
        },
      });

      console.log(games);
    }),
  {
    timeZone: "America/New_York",
    runOnInit: true,
  }
);
