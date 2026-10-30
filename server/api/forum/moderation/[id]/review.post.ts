import { hasRestriction } from "~/server/utils/permissions";
import { prisma } from "~/server/utils/prisma";
import { canReviewForum } from "~/server/utils/forumSafety";
import { checkForumBan, userCanViewCategory, userCanPostInCategory } from "~/server/utils/forum";
import { notifyForumPublication } from "~/server/utils/forumPublication";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  if (!(await canReviewForum(userId))) throw createError({ status: 403, statusMessage: "Forbidden" });
  const body = await readBody(event);
  if (!body || !["approve", "reject"].includes(body.action) || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000) {
    throw createError({ status: 400, statusMessage: "Choose a decision and provide a reason (up to 1,000 characters)." });
  }
  const submission = await prisma.forumSubmission.findUnique({ where: { id: event.context.params!.id }, include: { thread: { include: { category: true } } } });
  if (!submission || !(await userCanViewCategory(userId, submission.thread.category_id, submission.thread.category.is_private))) throw createError({ status: 404, statusMessage: "Submission not found" });
  if (submission.author_id === userId) throw createError({ status: 403, statusMessage: "Another moderator must review your contribution." });
  if (body.action === "approve" && submission.kind.startsWith("EDIT_") && await hasRestriction(submission.author_id, "EDIT_OWN_POST")) {
    throw createError({ status: 409, statusMessage: "The author can no longer edit posts. Reject this submission instead." });
  }
  if (body.action === "approve") {
    if (await checkForumBan(submission.author_id, submission.thread.category_id) || !(await userCanPostInCategory(submission.author_id, submission.thread.category_id, submission.thread.category.is_private, submission.kind === "THREAD" && submission.thread.category.mod_posting_only))) {
      throw createError({ status: 409, statusMessage: "The author can no longer post in this category. Reject this submission instead." });
    }
  }
  await prisma.$transaction(async tx => {
    const claimed = await tx.forumSubmission.updateMany({ where: { id: submission.id, status: "PENDING" }, data: {
      status: body.action === "approve" ? "PUBLISHED" : "REJECTED", review_reason: body.reason.trim(), reviewed_by: userId, reviewed_at: new Date(),
    } });
    if (!claimed.count) throw createError({ status: 409, statusMessage: "This submission has already been reviewed." });
    if (body.action === "approve") {
      const thread = await tx.forumThread.findUnique({ where: { id: submission.thread_id } });
      if (!thread || thread.deleted_at || thread.is_locked) throw createError({ status: 409, statusMessage: "The thread is deleted or locked. Reject this submission instead." });
      if (submission.kind === "EDIT_TITLE") {
        const result = await tx.forumThread.updateMany({ where: { id: thread.id, title: submission.base_title!, deleted_at: null }, data: { title: submission.title! } });
        if (!result.count) throw createError({ status: 409, statusMessage: "The title changed after this submission. Reject the stale edit." });
      } else {
        const post = await tx.forumPost.findUnique({ where: { id: submission.post_id! } });
        if (!post || post.deleted_at) throw createError({ status: 409, statusMessage: "The post has been deleted. Reject this submission instead." });
        if (submission.kind === "EDIT_POST") {
          const result = await tx.forumPost.updateMany({ where: { id: post.id, body: submission.base_body!, deleted_at: null }, data: { body: submission.body, edited_at: new Date() } });
          if (!result.count) throw createError({ status: 409, statusMessage: "The post changed after this submission. Reject the stale edit." });
          await tx.forumPostEdit.create({ data: { post_id: post.id, previous_body: post.body, edited_by: submission.author_id } });
        } else {
          await tx.forumPost.update({ where: { id: post.id }, data: { published: true, created_at: new Date() } });
          await tx.forumThread.update({ where: { id: thread.id }, data: { published: true, last_post_at: new Date() } });
        }
      }
    }
    await tx.forumModLog.create({ data: { actor_id: userId, action: body.action === "approve" ? "APPROVE_SUBMISSION" : "REJECT_SUBMISSION", target_type: "submission", target_id: submission.id, details: body.reason.trim() } });
  });
  if (body.action === "approve" && ["THREAD", "POST"].includes(submission.kind)) await notifyForumPublication(submission.thread_id, submission.post_id!, submission.kind === "THREAD");
  return { success: true };
});
