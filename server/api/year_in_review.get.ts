import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const year = 2024;
  const yearInReview = await prisma.yearInReview.findFirst({
    where: {
      user_id: me.id,
      year,
    },
  });

  if (!yearInReview) {
    const newYearInReview = await prisma.yearInReview.create({
      data: {
        id: nanoid(8),
        user_id: me.id,
        year,
      },
    });

    return newYearInReview.id;
  }

  return yearInReview.id;
});
