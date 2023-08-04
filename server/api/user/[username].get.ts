import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;

  const user = await prisma.userSettings.findUnique({
    where: {
      username,
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
  };
});
