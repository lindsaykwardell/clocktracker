import { PrismaClient, Community } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

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
