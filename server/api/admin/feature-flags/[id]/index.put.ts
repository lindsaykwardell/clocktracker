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

  const flagId = Number(handler.context.params!.id);
  const body = await readBody<{
    active?: boolean;
    enabled_for_supporters?: boolean;
    rollout_percentage?: number | null;
    effective_date?: string | null;
  }>(handler);

  const data: Record<string, any> = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.enabled_for_supporters === "boolean")
    data.enabled_for_supporters = body.enabled_for_supporters;
  if (body.rollout_percentage !== undefined) {
    data.rollout_percentage =
      body.rollout_percentage === null
        ? null
        : Math.max(0, Math.min(100, Math.round(body.rollout_percentage)));
  }
  if (body.effective_date !== undefined) {
    data.effective_date = body.effective_date ? new Date(body.effective_date) : null;
  }

  const flag = await prisma.featureFlag.update({
    where: { id: flagId },
    data,
    select: {
      id: true,
      active: true,
      enabled_for_supporters: true,
      rollout_percentage: true,
    },
  });

  return flag;
});
