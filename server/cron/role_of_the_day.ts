import { defineCronHandler } from "#nuxt/cron";
import dayjs from "dayjs";
import { roleOfTheDay } from "../utils/roleOfTheDay";
import { AtpAgent, RichText } from "@atproto/api";
import { PrismaClient } from "@prisma/client";

const agent = new AtpAgent({
  service: "https://bsky.social",
});

const prisma = new PrismaClient();

export default defineCronHandler("daily", async () => {
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

  const role = await roleOfTheDay();

  if (role) {
    // Get stats for the role
    const games = await prisma.game.findMany({
      where: {
        player_characters: {
          some: {
            role_id: role.id,
          },
        },
      },
      include: {
        player_characters: true,
      },
    });

    // Get the count of games played over the past 12 months
    const months = Array.from(Array(12).keys())
      .map((i) => dayjs().subtract(i, "month").format("MMMM"))
      .reverse();

    const games_by_month = Object.fromEntries(
      months.map((month) => [month, 0])
    );

    games.forEach((game) => {
      // If the game is not in the past 12 months, skip it
      if (dayjs(game.date).isBefore(dayjs().subtract(12, "month"))) {
        return;
      }
      const month = dayjs(game.date).format("MMMM");
      games_by_month[month] = games_by_month[month] + 1;
    });

    const averageGamesPerMonth = Math.round(
      games.length / Object.keys(games_by_month).length
    );

    const win_count = winRateByRole(games as unknown as GameRecord[], role);
    const popular_scripts = await prisma.game.groupBy({
      by: ["script_id", "script"],
      where: {
        player_characters: {
          some: {
            role_id: role.id,
          },
        },
      },
      orderBy: [
        {
          _count: {
            script_id: "desc",
          },
        },
        {
          script: "asc",
        },
      ],
      _count: {
        script_id: true,
      },
      take: 3,
    });

    const popular_scripts_formatted = [];

    for (const script of popular_scripts) {
      let logo: string | null = null;
      let version: string | null = null;
      let custom_script_id: string | null = null;

      if (script.script_id) {
        const associated_script = await prisma.script.findUnique({
          where: {
            id: script.script_id,
          },
          select: {
            logo: true,
            version: true,
            script_id: true,
            is_custom_script: true,
          },
        });

        if (associated_script) {
          logo = associated_script.logo;
          version = associated_script.version;
          if (associated_script.is_custom_script) {
            custom_script_id = associated_script.script_id;
          }
        }
      }

      const { win, total } = winRateByRole(
        games.filter(
          (g) => g.script_id === script.script_id
        ) as unknown as GameRecord[],
        role
      );

      const pct = +((win / total) * 100).toFixed(2);

      popular_scripts_formatted.push({
        script_id: script.script_id,
        script: script.script,
        version,
        custom_script_id,
        logo: logo,
        wins: win,
        pct,
        count: script._count.script_id,
      });
    }

    const win_loss = {
      total: win_count.total,
      win: win_count.win,
      loss: win_count.total - win_count.win,
      pct: +((win_count.win / win_count.total) * 100).toFixed(2) || 0,
    };

    // Fetch the role image
    const image = await fetch(
      `https://clocktracker.app/img/role/${role.id}.png`
    ).then((res) => res.blob());
    const blobRecord = await agent.uploadBlob(image, {
      encoding: "image/png",
    });

    // Post the role of the day
    const richText = new RichText({
      text: `Today's #BloodOnTheClocktower role of the day is the ${role.name}!

"${role.ability}"

https://clocktracker.app/roles/${role.id}`,
    });
    await richText.detectFacets(agent);

    const firstPost = await agent.post({
      text: richText.text,
      facets: richText.facets,
      embed: {
        $type: "app.bsky.embed.images#main",
        images: [
          {
            alt: `${role.name} role icon`,
            image: {
              $type: "blob",
              ref: blobRecord.data.blob.ref,
              mimeType: blobRecord.data.blob.mimeType,
              size: blobRecord.data.blob.size,
            },
          },
        ],
      },
    });

    const statsPost = await agent.post({
      text: `On ClockTracker, the ${
        role.name
      } has an average of ${averageGamesPerMonth} games played per month over the past year
Win Rate: ${win_loss.pct}%

Popular Scripts:
${popular_scripts_formatted
  .map((script) => `${script.script} (${script.pct}% win rate)`)
  .join("\n")}`,
      reply: {
        root: firstPost,
        parent: firstPost,
      },
    });
  }
});
