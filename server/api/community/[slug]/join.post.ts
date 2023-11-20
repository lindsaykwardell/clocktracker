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
    },
  });

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Promote the user to moderator

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
