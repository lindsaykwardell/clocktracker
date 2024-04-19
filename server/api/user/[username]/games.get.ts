import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { fetchGames } from "~/server/utils/fetchGames";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params?.username as string;
  const waiting_for_confirmation =
    getQuery(handler)?.show_tagged_games === "true";

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

  return await fetchGames(user.user_id, me, waiting_for_confirmation);
});
