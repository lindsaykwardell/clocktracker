import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody(handler);

  console.log("body", body);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body || !body.user_id) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        {
          from_user_id: user.id,
          user_id: body.user_id,
        },
        {
          from_user_id: body.user_id,
          user_id: user.id,
        },
      ],
      accepted: false,
    },
  });

  if (existingRequest) {
    await prisma.friendRequest.delete({
      where: {
        id: existingRequest.id,
      },
    });
  }

  return true;
});
