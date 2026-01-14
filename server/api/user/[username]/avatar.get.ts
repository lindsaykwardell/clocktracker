import { prisma } from "~/server/utils/prisma";

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

  return sendRedirect(handler, user.avatar!, 302);
});
