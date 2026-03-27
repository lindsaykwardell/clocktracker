import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasRestriction } from "~/server/utils/permissions";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (await hasRestriction(me.id, "JOIN_COMMUNITY")) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  const community = await prisma.community.findUnique({
    where: {
      slug: community_slug,
      banned_users: {
        none: {
          user_id: me.id,
        },
      },
      join_requests: {
        none: {
          user_id: me.id,
        },
      },
    },
    select: {
      name: true,
      is_private: true,
      admins: { select: { user_id: true } },
    },
  });

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (community.is_private) {
    await prisma.community.update({
      where: {
        slug: community_slug,
      },
      data: {
        join_requests: {
          connect: [
            {
              user_id: me.id,
            },
          ],
        },
      },
    });

    // Notify community admins about the join request
    const adminIds = community.admins.map((a) => a.user_id);
    if (adminIds.length > 0) {
      const requester = await prisma.userSettings.findUnique({
        where: { user_id: me.id },
        select: { display_name: true },
      });

      void sendPushNotifications({
        userIds: adminIds,
        title: `Join Request: ${community.name}`,
        body: `${requester?.display_name ?? "Someone"} wants to join your community`,
        url: `/community/${community_slug}`,
      });
    }

    return true;
  }

  await prisma.community.update({
    where: {
      slug: community_slug,
    },
    data: {
      members: {
        connect: [
          {
            user_id: me.id,
          },
        ],
      },
    },
  });

  return true;
});
