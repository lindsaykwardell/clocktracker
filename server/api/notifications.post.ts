import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Update all notifications to be read
  await prisma.notification.updateMany({
    where: {
      user_id: user.id,
    },
    data: {
      read: true,
    },
  });

  return true;
});
