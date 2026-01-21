import type { User } from "@supabase/supabase-js";
import { Chart } from "@prisma/client";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Chart>(handler);
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

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  return prisma.chart.update({
    where: {
      id,
      user_id: userId,
    },
    data: {
      ...body,
      width: body.width || 250,
      height: body.height || 250,
    },
  });
});
