import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

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

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
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
      community: {
        slug: community_slug,
      },
      OR: [
        {
          user_id: userId,
        },
        {
          community: {
            admins: {
              some: {
                user_id: userId,
              },
            },
          },
        },
      ],
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
