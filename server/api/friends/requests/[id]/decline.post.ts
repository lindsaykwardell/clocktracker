import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const requestId = +(handler.context.params?.id as string);
  const user = handler.context.user as User;

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
    });
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!friendRequest || friendRequest.user_id !== userId) {
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
