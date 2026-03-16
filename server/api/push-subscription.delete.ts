import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody<{ endpoint: string } | null>(handler);

  if (!body?.endpoint) {
    throw createError({ status: 400, statusMessage: "Endpoint is required" });
  }

  await prisma.pushSubscription.deleteMany({
    where: { user_id: me.id, endpoint: body.endpoint },
  });

  // If user has no more subscriptions, disable push notifications
  const remaining = await prisma.pushSubscription.count({
    where: { user_id: me.id },
  });

  if (remaining === 0) {
    await prisma.userSettings.update({
      where: { user_id: me.id },
      data: { push_notifications_enabled: false },
    });
  }

  return { ok: true };
});
