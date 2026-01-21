import { Community } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const did = handler.context.params!.did;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
    });
  }

  const done = await prisma.did.upsert({
    where: {
      user_id_did: {
        user_id: userId,
        did,
      },
    },
    create: {
      user_id: userId,
      did,
    },
    update: {
      user_id: userId,
      did,
    },
    select: {
      id: true,
      did: true,
    }
  });

  return done;
});
