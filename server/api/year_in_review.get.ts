import { PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const year = new Date().getFullYear();
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
