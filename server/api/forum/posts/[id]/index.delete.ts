import {
  requireForumPostAccess,
  hasForumPermission,
  logModAction,
  modLogNote,
} from "~/server/utils/forum";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission, hasRestriction } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const postId = handler.context.params!.id;
  await requireForumPostAccess(me?.id ?? null, postId);

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, deleted_at: null },
    include: {
      thread: {
        select: {
          id: true,
          _count: { select: { posts: { where: { deleted_at: null, published: true } } } },
        },
      },
    },
  });

  if (!post) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const isAuthor = post.author_id === me.id;
  const canDeleteOwn =
    isAuthor && !(await hasRestriction(me.id, "DELETE_OWN_POST"));
  const canDeleteAny = await hasForumPermission(me.id, "DELETE_ANY_POST");

  if (!canDeleteOwn && !canDeleteAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  // Deleting from a report closes that report too, and logs one entry for both.
  const body = (await readBody(handler).catch(() => null)) ?? {};
  const note = modLogNote(body.note);
  let reportId: string | null = null;
  if (body.report_id) {
    if (!(await hasPermission(me.id, "VIEW_REPORTS"))) {
      throw createError({ status: 403, statusMessage: "Forbidden" });
    }
    const report = await prisma.forumPostReport.findFirst({
      where: { id: String(body.report_id), post_id: postId, resolved: false },
      select: { id: true },
    });
    if (!report) {
      throw createError({ status: 404, statusMessage: "Report not found" });
    }
    reportId = report.id;
  }

  const now = new Date();
  const resolveReport = reportId
    ? [prisma.forumPostReport.update({
        where: { id: reportId },
        data: { resolved: true, resolved_by: me.id, resolved_at: now },
      })]
    : [];
  const log = (threadDeleted: boolean) =>
    reportId
      ? logModAction(
          me.id,
          "RESOLVE_REPORT_DELETED",
          "report",
          reportId,
          [note, threadDeleted ? "Thread also deleted" : null].filter(Boolean).join(". ")
        )
      : logModAction(me.id, "DELETE_POST", "post", postId, threadDeleted ? "Thread also deleted" : undefined);

  // Check if this is the first post and the only remaining post
  const firstPost = await prisma.forumPost.findFirst({
    where: { thread_id: post.thread.id, deleted_at: null, published: true },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  const isFirstPost = firstPost?.id === postId;
  const isOnlyPost = post.thread._count.posts <= 1;

  if (isFirstPost && isOnlyPost) {
    // Delete the entire thread if this is the only post
    await prisma.$transaction([
      prisma.forumPost.update({
        where: { id: postId },
        data: { deleted_at: now },
      }),
      prisma.forumThread.update({
        where: { id: post.thread.id },
        data: { deleted_at: now },
      }),
      ...resolveReport,
    ]);

    await log(true);
    return { success: true, threadDeleted: true };
  }

  // Otherwise just soft-delete the post
  await prisma.$transaction([
    prisma.forumPost.update({
      where: { id: postId },
      data: { deleted_at: now },
    }),
    ...resolveReport,
  ]);

  await log(false);

  return { success: true, threadDeleted: false };
});
