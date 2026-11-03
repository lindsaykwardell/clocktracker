import { createError } from "h3";
import { prisma } from "./prisma";
import { hasPermission, isAdmin } from "./permissions";

import { normalizedForumText, screeningReason, editScreeningReason, accountYoungerThan } from "./forumPolicy";

async function accountAge(userId: string) {
  if (await isAdmin(userId) || await hasPermission(userId, "EDIT_ANY_POST")) return { newcomer: false, youngEditor: false };
  const user = await prisma.userSettings.findUnique({ where: { user_id: userId }, select: { created_at: true } });
  return { newcomer: accountYoungerThan(user?.created_at ?? null, 1), youngEditor: accountYoungerThan(user?.created_at ?? null, 7) };
}

export async function isForumNewcomer(userId: string) {
  return (await accountAge(userId)).newcomer;
}

export async function assessForumSubmission(userId: string, body: string, { excludePostId = null, previousText, title = "" }: { excludePostId?: string | null; previousText?: string; title?: string } = {}) {
  const recent = await prisma.forumPost.findMany({
    where: { author_id: userId, created_at: { gt: new Date(Date.now() - 86400000) }, ...(excludePostId ? { id: { not: excludePostId } } : {}) },
    select: { body: true }, take: 200, orderBy: { created_at: "desc" },
  });
  const pending = await prisma.forumSubmission.findMany({ where: { author_id: userId, status: "PENDING" }, select: { body: true, post_id: true } });
  if (recent.some(p => normalizedForumText(p.body) === normalizedForumText(body)) || pending.some(p => p.post_id !== excludePostId && normalizedForumText(p.body) === normalizedForumText(body))) {
    throw createError({ statusCode: 409, statusMessage: "This repeats a recent contribution. Please add to the existing discussion." });
  }
  const age = await accountAge(userId);
  const reason = previousText === undefined
    ? screeningReason(`${title} ${body}`, age.newcomer)
    : editScreeningReason(body, previousText, age.youngEditor);
  if (reason && pending.length >= 5) throw createError({ statusCode: 429, statusMessage: "You already have five contributions awaiting review." });
  return reason;
}

export async function mutedForumAuthors(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  const preferences = await prisma.forumUserPreference.findMany({
    where: { user_id: userId, kind: "MUTE" }, select: { target_id: true },
  });
  return preferences.map(p => p.target_id);
}

export async function forumVisibility(_userId: string | null) {
  return { published: true, deleted_at: null };
}

export async function canReviewForum(userId: string) {
  return await hasPermission(userId, "VIEW_REPORTS") && await hasPermission(userId, "EDIT_ANY_POST");
}
