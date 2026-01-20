import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
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
      accepted: false,
    },
    include: {
      from_user: {
        select: {
          user_id: true,
          username: true,
        },
      },
      user: {
        select: {
          user_id: true,
          username: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return requests;
});
