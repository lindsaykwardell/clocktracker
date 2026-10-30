import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import {
  forumUserSelect,
  userCanPostInCategory,
  checkForumBan,
  checkPostLength,
} from "~/server/utils/forum";
import { hasRestriction } from "~/server/utils/permissions";
import { screeningReason } from "~/server/utils/forumPolicy";
import { assessForumSubmission } from "~/server/utils/forumSafety";
import { notifyForumPublication } from "~/server/utils/forumPublication";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const slug = handler.context.params!.slug;
  const body = await readBody<{ title: string; body: string } | null>(handler);

  if (
    typeof body?.title !== "string" || !body.title.trim() ||
    typeof body?.body !== "string" || !body.body.trim()
  ) {
    throw createError({
      status: 400,
      statusMessage: "Title and body are required",
    });
  }
  if (body.title.trim().length > 200) {
    throw createError({ status: 400, statusMessage: "Title cannot exceed 200 characters" });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  if (await hasRestriction(me.id, "CREATE_THREAD")) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const canPost = await userCanPostInCategory(
    me.id,
    category.id,
    category.is_private,
    category.mod_posting_only
  );

  if (!canPost) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  if (await checkForumBan(me.id, category.id)) {
    throw createError({
      status: 403,
      statusMessage: "You are banned from posting",
    });
  }

  await checkPostLength(me.id, body.body.trim());

  const reason = await assessForumSubmission(me.id, body.body.trim()) || screeningReason(body.title.trim(), false);
  const thread = await prisma.$transaction(async tx => {
    const created = await tx.forumThread.create({
      data: {
        title: body.title.trim(), category_id: category.id, author_id: me.id,
        published: !reason,
        posts: { create: { body: body.body.trim(), author_id: me.id, published: !reason } },
      },
      include: { posts: true, author: { select: forumUserSelect }, _count: { select: { posts: true } } },
    });
    if (reason) await tx.forumSubmission.create({ data: {
      author_id: me.id, thread_id: created.id, post_id: created.posts[0].id,
      kind: "THREAD", title: created.title, body: body.body.trim(), reason,
    } });
    return created;
  });
  if (!reason) await notifyForumPublication(thread.id, thread.posts[0].id, true);
  return { ...thread, pending: !!reason };
});
