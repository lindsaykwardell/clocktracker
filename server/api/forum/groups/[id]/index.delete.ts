import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const groupId = handler.context.params!.id;

  const group = await prisma.userGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  await prisma.userGroup.delete({
    where: { id: groupId },
  });

  return { success: true };
});
