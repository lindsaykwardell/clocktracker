import { PrismaClient, Game, Character } from "@prisma/client";
import { navigateTo } from "nuxt/app";

export default defineEventHandler(async (handler) => {
  const username = handler.context.params?.username as string;

  const prisma = new PrismaClient();
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

  return sendRedirect(handler, user.avatar!, 302);
});
