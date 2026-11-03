import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasRestriction } from "~/server/utils/permissions";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body || !body.user_id) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  if (await hasRestriction(user.id, "SEND_FRIEND_REQUEST")) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        {
          from_user_id: user.id,
          user_id: body.user_id,
        },
        {
          from_user_id: body.user_id,
          user_id: user.id,
        }
      ],
      accepted: false,
    },
  });

  if (existingRequest) {
    return existingRequest;
  } else {
    const request = await prisma.friendRequest.create({
      data: {
        from_user_id: user.id,
        user_id: body.user_id,
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
    });

    void sendPushNotifications({
      userIds: [body.user_id],
      title: "New Friend Request",
      body: `${request.from_user.username} sent you a friend request`,
      url: "/",
    });

    return request;
  }
});
