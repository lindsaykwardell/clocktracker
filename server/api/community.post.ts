import { PrismaClient, Community } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Community>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
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
              user_id: user.id,
            },
          ],
        },
        admins: {
          connect: [
            {
              user_id: user.id,
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
