import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  const percentage = Math.floor(
    ((me ? parseInt(me.id.slice(0, 2), 16) : 0) / 255) * 100
  );

  console.log(percentage);

  const flags = await prisma.featureFlag.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const enabledFlags = await prisma.featureFlag.findMany({
    where: {
      OR: [
        {
          active: true,
        },
        {
          percentage: {
            lte: percentage,
          },
        },
        {
          active_for: {
            some: {
              user_id: me?.id || "",
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const payload: { [key: string]: boolean } = {};

  for (const flag of flags) {
    payload[flag.name] = enabledFlags.some(
      (enabledFlag) => enabledFlag.id === flag.id
    );
  }

  return payload;
});
