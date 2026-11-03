import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { addUserKofiLevel } from "~/server/utils/addUserKofiLevel";
import { prisma } from "~/server/utils/prisma";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;
  const user_id = handler.context.params?.user_id;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const user = await prisma.userSettings.findUnique({
    where: {
      user_id,
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
    },
  });

  if (!user) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const community = await prisma.community.findUnique({
    where: {
      slug: community_slug,
      join_requests: {
        some: {
          user_id: user.user_id,
        },
      },
      admins: {
        some: {
          user_id: me.id,
        },
      },
    },
  });

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Demote the user to moderator

  await prisma.community.update({
    where: {
      slug: community_slug,
    },
    data: {
      join_requests: {
        disconnect: {
          user_id: user.user_id,
        },
      },
      members: {
        connect: {
          user_id: user.user_id,
        },
      },
    },
  });

  void sendPushNotifications({
    userIds: [user.user_id],
    title: `Welcome to ${community.name}!`,
    body: "Your join request has been approved",
    url: `/community/${community_slug}`,
  });

  return addUserKofiLevel(user);
});
