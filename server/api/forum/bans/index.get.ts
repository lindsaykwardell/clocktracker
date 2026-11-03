import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, hasForumPermission } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasForumPermission(me.id, "BAN_USER"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const bans = await prisma.forumBan.findMany({
    where: {
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    orderBy: { created_at: "desc" },
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

  return bans;
});
