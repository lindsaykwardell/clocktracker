import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const body = await readBody<{ content: string; reply_to_id?: string } | null>(
    handler
  );

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const community = await prisma.community.findUnique({
    where: {
      slug,
      members: {
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

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const post = await prisma.communityPost.create({
    data: {
      ...body,
      community_id: community.id,
      user_id: me.id,
    },
    select: {
      id: true,
      content: true,
      created_at: true,
      user: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
      replies: {
        select: {
          id: true,
          content: true,
          created_at: true,
          user: {
            select: {
              user_id: true,
              username: true,
              display_name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  // Notify community members
  const members = await prisma.community.findUnique({
    where: { slug },
    select: { members: { select: { user_id: true } } },
  });

  if (members) {
    const snippet = body.content
      .replace(/[#*_~`>\[\]()!|\\-]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200);

    void sendPushNotifications({
      userIds: members.members.map((m) => m.user_id),
      excludeUserId: me.id,
      title: `New post in ${community.name}`,
      body: `${post.user.display_name}: ${snippet}`,
      url: `/community/${slug}`,
    });
  }

  return post;
});
