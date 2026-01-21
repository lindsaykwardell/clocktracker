import { Community } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Community>(handler);

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

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  try {
    const community = await prisma.community.create({
      data: {
        ...body,
        members: {
          connect: [
            {
              user_id: userId,
            },
          ],
        },
        admins: {
          connect: [
            {
              user_id: userId,
            },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  
    return community;
  } catch (err) {
    console.error(err);
    throw createError({
      status: 500,
      statusMessage: "A community with a similar name already exists.",
    });
  }
});
