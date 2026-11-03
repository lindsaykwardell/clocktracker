import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody<{ token: string } | null>(handler);

  if (!body?.token) {
    throw createError({ status: 400, statusMessage: "Missing token" });
  }

  await prisma.fcmToken.deleteMany({
    where: { user_id: me.id, token: body.token },
  });

  // If no subscriptions remain (web or FCM), disable push notifications
  const [webCount, fcmCount] = await Promise.all([
    prisma.pushSubscription.count({ where: { user_id: me.id } }),
    prisma.fcmToken.count({ where: { user_id: me.id } }),
  ]);

  if (webCount === 0 && fcmCount === 0) {
    await prisma.userSettings.update({
      where: { user_id: me.id },
      data: { push_notifications_enabled: false },
    });
  }

  return { ok: true };
});
