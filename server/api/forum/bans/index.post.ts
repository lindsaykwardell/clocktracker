import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, hasForumPermission, logModAction } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasForumPermission(me.id, "BAN_USER"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    user_id: string;
    category_id?: string;
    reason?: string;
    expires_at?: string;
  } | null>(handler);

  if (!body?.user_id) {
    throw createError({ status: 400, statusMessage: "user_id is required" });
  }

  const targetUser = await prisma.userSettings.findUnique({
    where: { user_id: body.user_id },
  });

  if (!targetUser) {
    throw createError({ status: 404, statusMessage: "User not found" });
  }

  if (targetUser.is_admin) {
    throw createError({
      status: 403,
      statusMessage: "Cannot ban an admin",
    });
  }

  const ban = await prisma.forumBan.create({
    data: {
      user_id: body.user_id,
      category_id: body.category_id ?? null,
      reason: body.reason ?? null,
      banned_by: me.id,
      expires_at: body.expires_at ? new Date(body.expires_at) : null,
    },
    select: {
      id: true,
      reason: true,
      expires_at: true,
      created_at: true,
      user: { select: forumUserSelect },
      category: { select: { id: true, name: true, slug: true } },
      banned_by_user: { select: forumUserSelect },
    },
  });

  await logModAction(me.id, "BAN_USER", "user", body.user_id, body.reason || undefined);

  return ban;
});
