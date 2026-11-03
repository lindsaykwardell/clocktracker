import type { Community } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const did = handler.context.params!.did;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const done = await prisma.did.upsert({
    where: {
      user_id_did: {
        user_id: user.id,
        did,
      },
    },
    create: {
      user_id: user.id,
      did,
    },
    update: {
      user_id: user.id,
      did,
    },
    select: {
      id: true,
      did: true,
    }
  });

  return done;
});
