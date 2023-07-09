import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;

  const prisma = new PrismaClient();
  const user = await prisma.userSettings.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return {
    user_id: user.user_id,
    username: user.username,
  };
});
