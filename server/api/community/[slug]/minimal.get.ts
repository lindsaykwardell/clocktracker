import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const slug = handler.context.params!.slug;

  const community = await prisma.community.findUnique({
    where: {
      slug,
    },
    select: {
      name: true,
      description: true,
      icon: true,
    },
  });

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return community;
});
