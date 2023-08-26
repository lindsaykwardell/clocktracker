import type { User } from "@supabase/supabase-js";
import { PrismaClient, Chart } from "@prisma/client";

const prisma = new PrismaClient();

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
