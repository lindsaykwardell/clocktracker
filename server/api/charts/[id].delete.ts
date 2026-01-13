import type { User } from "@supabase/supabase-js";
import { Chart } from "@prisma/client";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const id = +handler.context.params?.id!;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  return prisma.chart.delete({
    where: {
      id,
      user_id: user.id,
    },
  });
});
