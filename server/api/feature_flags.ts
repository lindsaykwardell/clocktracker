import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  const latest_kofi_payment = await prisma.koFiPayment.findFirst({
    where: {
      user_id: me?.id || "",
      expires_at: {
        gte: new Date(),
      },
    },
    orderBy: {
      expires_at: "desc",
    },
  });

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
          active_for: {
            some: {
              user_id: me?.id || "",
            },
          },
        },
        {
          enabled_for_supporters: !!latest_kofi_payment,
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
