import type { User } from "@supabase/supabase-js";
import { Chart } from "@prisma/client";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const id = +handler.context.params?.id!;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
    });
  }

  return prisma.chart.findFirst({
    where: {
      id,
      user_id: userId,
    },
  });
});
