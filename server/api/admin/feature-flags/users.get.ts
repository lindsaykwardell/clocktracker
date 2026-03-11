import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  const user = await prisma.userSettings.findUnique({
    where: { user_id: me.id },
    select: { is_admin: true },
  });

  if (!user?.is_admin) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(handler);
  const q = (query.q as string || "").trim();

  if (q.length < 2) {
    return [];
  }

  const users = await prisma.userSettings.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { display_name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
    },
    take: 20,
    orderBy: { username: "asc" },
  });

  return users;
});
