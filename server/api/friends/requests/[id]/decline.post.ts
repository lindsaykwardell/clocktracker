import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const requestId = +(handler.context.params?.id as string);
  const user = handler.context.user as User;

  const friendRequest = await prisma.friendRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!friendRequest || friendRequest.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  await prisma.friendRequest.delete({
    where: {
      id: requestId,
    },
  });

  return true;
});
