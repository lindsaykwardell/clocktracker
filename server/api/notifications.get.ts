import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  const settings = await prisma.userSettings.findFirst({
    where: {
      user_id: user.id,
    },
    include: {
      notifications: {
        include: {
          from_user: {
            select: {
              username: true,
              display_name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return settings?.notifications || [];
});
