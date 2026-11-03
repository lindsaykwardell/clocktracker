import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin, getUserPermissions } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const { query } = getQuery(handler) as { query: string };

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const admin = await isAdmin(me.id);
  if (!admin) {
    const perms = await getUserPermissions(me.id);
    const hasAnyAdminPerm = perms.some((p) =>
      [
        "MANAGE_GROUPS",
        "EXPORT_USER_DATA",
        "BAN_USER",
      ].includes(p)
    );
    if (!hasAnyAdminPerm) {
      throw createError({ status: 403, statusMessage: "Forbidden" });
    }
  }

  const search = (query || "").trim();
  if (search.length < 2) {
    return [];
  }

  return prisma.userSettings.findMany({
    where: {
      OR: [
        { username: { contains: search, mode: "insensitive" } },
        { display_name: { contains: search, mode: "insensitive" } },
      ],
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
    },
    orderBy: [{ display_name: "asc" }, { username: "asc" }],
    take: 10,
  });
});
