import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { fetchGamesV2 } from "~/server/utils/fetchGames";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

  const user = await prisma.userSettings.findUnique({
    where: {
      username,
    },
    select: {
      user_id: true,
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return fetchGamesV2(
    {
      user_id: user.user_id,
    },
    me
  );
});
