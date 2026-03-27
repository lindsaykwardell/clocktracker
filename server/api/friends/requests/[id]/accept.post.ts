import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

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

  // Notify the original requester that their friend request was accepted
  const accepter = await prisma.userSettings.findUnique({
    where: { user_id: user.id },
    select: { display_name: true, username: true },
  });

  void sendPushNotifications({
    userIds: [friendRequest.from_user_id],
    title: "Friend Request Accepted",
    body: `${accepter?.display_name ?? "Someone"} accepted your friend request`,
    url: `/@${accepter?.username}`,
  });

  return friend;
});
