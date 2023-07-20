import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const scripts = await readBody(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!scripts) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Ensure user is admin
  const prisma = new PrismaClient();

  const settings = await prisma.userSettings.findUnique({
    where: {
      user_id: user.id,
    },
  });

  if (!settings?.is_admin) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  await prisma.script.deleteMany({});
  const saved = await prisma.script
    .createMany({
      data: scripts,
      skipDuplicates: true,
    })
    .catch((err) => console.error(err));

  return saved;
});
