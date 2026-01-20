import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody(handler);

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
        }
      ],
      accepted: false,
    },
  });

  if (existingRequest) {
    return existingRequest;
  } else {
    const request = await prisma.friendRequest.create({
      data: {
        from_user_id: user.id,
        user_id: body.user_id,
      },
      include: {
        from_user: {
          select: {
            user_id: true,
            username: true,
          },
        },
        user: {
          select: {
            user_id: true,
            username: true,
          },
        },
      },
    });

    return request;
  }
});
