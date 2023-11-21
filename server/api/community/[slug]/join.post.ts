import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
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
      is_private: true,
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
