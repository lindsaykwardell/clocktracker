import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  const admin = await prisma.userSettings.findUnique({
    where: { user_id: me.id },
    select: { is_admin: true },
  });

  if (!admin?.is_admin) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const flagId = Number(handler.context.params!.id);

  await prisma.featureFlag.delete({
    where: { id: flagId },
  });

  return { success: true };
});
