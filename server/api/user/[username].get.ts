import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;

  const prisma = new PrismaClient();
  const user = await prisma.userSettings.findUnique({
    where: {
      username,
    },
    include: {
      followers: {
        select: {
          user: {
            select: {
              user_id: true,
              username: true,
              avatar: true,
              display_name: true,
              pronouns: true,
              location: true,
            },
          },
        },
      },
      following: {
        select: {
          following: {
            select: {
              user_id: true,
              username: true,
              avatar: true,
              display_name: true,
              pronouns: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return {
    user_id: user.user_id,
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    pronouns: user.pronouns,
    bio: user.bio,
    location: user.location,
    followers: user.followers,
    following: user.following,
  };
});
