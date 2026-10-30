import {
  requireForumPostAccess,
  requireForumWriteAccess,
  forumUserSelect,
  hasForumPermission,
  checkPostLength,
} from "~/server/utils/forum";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasRestriction } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const postId = handler.context.params!.id;
  const accessible = await requireForumPostAccess(me?.id ?? null, postId);
  const body = await readBody<{ body: string } | null>(handler);

  if (typeof body?.body !== "string" || !body.body.trim()) {
    throw createError({ status: 400, statusMessage: "Post body is required" });
  }

  const { post } = accessible;

  const isAuthor = post.author_id === me.id;
  const canEditOwn =
    isAuthor && !(await hasRestriction(me.id, "EDIT_OWN_POST"));
  const canEditAny = await hasForumPermission(me.id, "EDIT_ANY_POST");

  if (!canEditOwn && !canEditAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  await requireForumWriteAccess(me.id, accessible.thread, { moderation: canEditAny });

  await checkPostLength(me.id, body.body.trim());

  const [, updated] = await prisma.$transaction([
    prisma.forumPostEdit.create({
      data: {
        post_id: postId,
        previous_body: post.body,
        edited_by: me.id,
      },
    }),
    prisma.forumPost.update({
      where: { id: postId },
      data: {
        body: body.body.trim(),
        edited_at: new Date(),
      },
      select: {
        id: true,
        body: true,
        created_at: true,
        edited_at: true,
        author: { select: forumUserSelect },
      },
    }),
  ]);

  return updated;
});
