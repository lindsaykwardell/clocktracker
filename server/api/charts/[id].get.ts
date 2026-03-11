import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import type { Chart } from "~/server/generated/prisma/client";
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

  return prisma.chart.findFirst({
    where: {
      id,
      user_id: user.id,
    },
  });
});
