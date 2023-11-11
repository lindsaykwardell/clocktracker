import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;
  const post_id = handler.context.params?.post_id;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!community_slug || !post_id) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const post = await prisma.communityPost.findUnique({
    where: {
      id: post_id,
      user_id: user.id,
      community: {
        slug: community_slug,
      },
    },
  });

  if (!post) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // delete the game
  await prisma.communityPost.update({
    where: {
      id: post_id,
    },
    data: {
      deleted: true,
      deleted_date: new Date(),
    },
  });

  return post;
});
