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

  await prisma.friendRequest.update({
    where: {
      id: requestId,
    },
    data: {
      accepted: true,
    },
  });

  const friend = await prisma.friend.create({
    data: {
      user_id: friendRequest.user_id,
      friend_id: friendRequest.from_user_id,
    },
    select: {
      friend: {
        select: {
          user_id: true,
          username: true,
          avatar: true,
          display_name: true,
          pronouns: true,
          location: true,
        },
      },
    },
  });

  const otherFriend = await prisma.friend.create({
    data: {
      user_id: friendRequest.from_user_id,
      friend_id: friendRequest.user_id,
    },
  });

  return friend;
});
