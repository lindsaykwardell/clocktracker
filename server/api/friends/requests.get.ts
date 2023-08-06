import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          from_user_id: user.id,
        },
        {
          user_id: user.id,
        },
      ],
      accepted: false
    },
    orderBy: {
      created_at: "desc",
    }
  });

  return requests;
});
