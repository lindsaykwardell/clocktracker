import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  } | null>(handler);

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    throw createError({ status: 400, statusMessage: "Invalid subscription" });
  }

  await prisma.$transaction([
    prisma.pushSubscription.upsert({
      where: {
        user_id_endpoint: { user_id: me.id, endpoint: body.endpoint },
      },
      create: {
        user_id: me.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
    }),
    prisma.userSettings.update({
      where: { user_id: me.id },
      data: { push_notifications_enabled: true },
    }),
  ]);

  return { ok: true };
});
