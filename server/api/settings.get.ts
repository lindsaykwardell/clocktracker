import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { addUserKofiLevel } from "../utils/addUserKofiLevel";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const settings = await prisma.userSettings.findFirst({
    where: {
      user_id: user.id,
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      finished_welcome: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
      bgg_username: true,
      enable_bgstats: true,
      discord_id: true,
      opt_into_testing: true,
      community_admin: {
        select: {
          id: true,
        },
      },
      communities: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          _count: {
            select: {
              members: true,
              admins: true,
              posts: {
                where: {
                  deleted: false,
                },
              },
            },
          },
        },
      },
      dids: {
        select: {
          id: true,
          did: true,
        },
      },
    },
  });

  if (settings) {
    if (!settings.discord_id && user.app_metadata.provider === "discord") {
      await prisma.userSettings.update({
        where: {
          user_id: user.id,
        },
        data: {
          discord_id: user.user_metadata.provider_id,
        },
      });
    }

    settings.discord_id = user.user_metadata.provider_id;

    if (settings.charts.length <= 0) {
      const charts = await prisma.chart.createMany({
        data: [
          {
            user_id: settings.user_id,
            title: "Win Rate",
            type: "BAR",
            data: "WIN",
            pivot: "ROLE",
            width: 250,
            height: 250,
          },
          {
            user_id: settings.user_id,
            title: "Role Types",
            type: "PIE",
            data: "ROLE",
            pivot: null,
            width: 250,
            height: 250,
          },
        ],
      });

      settings.charts = await prisma.chart.findMany({
        where: {
          user_id: settings.user_id,
        },
      });
    }

    return addUserKofiLevel(settings);
  }

  const existingUsername = user.user_metadata.full_name
    ? (
        await prisma.userSettings.findFirst({
          where: {
            username: {
              equals: user.user_metadata.full_name,
              mode: "insensitive",
            },
          },
        })
      )?.username
    : null;

  // If the username does not exist, use the full name from the user metadata.
  // Otherwise, generate a random username based on roles.

  const randomName = generateName();

  const username = existingUsername
    ? user.user_metadata.full_name
    : randomName.username;

  const newSettings = await prisma.userSettings.create({
    data: {
      user_id: user.id,
      username,
      display_name: user.user_metadata.full_name || randomName.display_name,
      avatar: user.user_metadata.avatar_url || "/img/default.png",
      email: user.email,
      charts: {
        create: [
          {
            title: "Win Rate",
            type: "BAR",
            data: "WIN",
            pivot: "ROLE",
            width: 250,
            height: 250,
          },
          {
            title: "Role Types",
            type: "PIE",
            data: "ROLE",
            pivot: null,
            width: 250,
            height: 250,
          },
        ],
      },
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      finished_welcome: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
      bgg_username: true,
      enable_bgstats: true,
      opt_into_testing: true,
      community_admin: {
        select: {
          id: true,
        },
      },
      communities: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          _count: {
            select: {
              members: true,
              admins: true,
              posts: {
                where: {
                  deleted: false,
                },
              },
            },
          },
        },
      },
      dids: {
        select: {
          id: true,
          did: true,
        },
      },
    },
  });

  // connect KoFi payments that were made with the same email address
  await prisma.koFiPayment.updateMany({
    where: {
      email: user.email,
      user_id: {
        equals: null,
      },
    },
    data: {
      user_id: user.id,
    },
  });

  return addUserKofiLevel({ ...newSettings });
});
