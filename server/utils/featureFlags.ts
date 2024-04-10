import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function getFeatureFlags(me: User | null) {
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
        !!latest_kofi_payment
          ? {
              enabled_for_supporters: true,
            }
          : {},
      ],
    },
    select: {
      id: true,
    },
  });

  console.log(enabledFlags);

  const payload: { [key: string]: boolean } = {};

  for (const flag of flags) {
    payload[flag.name] = enabledFlags.some(
      (enabledFlag) => enabledFlag.id === flag.id
    );
  }

  return payload;
}

export async function useFeatureFlags(me: User | null) {
  const flags = new Map<string, boolean>();
  const feature_flags = await getFeatureFlags(me);

  for (const [key, value] of Object.entries(feature_flags || {})) {
    flags.set(key, value);
  }

  return {
    isEnabled(flag: string) {
      return flags.get(flag) || false;
    },
  };
}
