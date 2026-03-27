import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  if (!(await hasPermission(me.id, "MANAGE_FEATURE_FLAGS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const flagId = Number(handler.context.params!.id);

  await prisma.featureFlag.delete({
    where: { id: flagId },
  });

  return { success: true };
});
