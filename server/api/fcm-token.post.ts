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

  // Upsert the token and enable push notifications
  await prisma.$transaction([
    prisma.fcmToken.upsert({
      where: {
        user_id_token: { user_id: me.id, token: body.token },
      },
      create: {
        user_id: me.id,
        token: body.token,
      },
      update: {},
    }),
    prisma.userSettings.update({
      where: { user_id: me.id },
      data: { push_notifications_enabled: true },
    }),
  ]);

  return { ok: true };
});
