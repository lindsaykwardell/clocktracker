import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

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
      communities: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
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
    },
  });

  if (settings) return settings;

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
      communities: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
    },
  });

  return newSettings;
});
