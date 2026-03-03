import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

type RoleStatCardBody = {
  role_id: string | null;
  source: string;
  metric_key: string;
  storyteller_only?: boolean;
};

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<RoleStatCardBody>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body?.source || !body.metric_key) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  return prisma.roleStatCard.create({
    data: {
      user_id: user.id,
      role_id: body.role_id,
      source: body.source,
      metric_key: body.metric_key,
      storyteller_only: !!body.storyteller_only,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          ability: true,
          token_url: true,
          type: true,
          initial_alignment: true,
        },
      },
    },
  });
});
