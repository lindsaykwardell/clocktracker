import type { User } from "@supabase/supabase-js";
import { PrismaClient, Chart } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Chart>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  return prisma.chart.create({
    data: {
      ...body,
      width: body.width || 250,
      height: body.height || 250,
      user_id: user.id,
    },
  });
});
