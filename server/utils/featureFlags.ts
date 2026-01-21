import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { getUserId } from "~/server/utils/getUserId";

export async function getFeatureFlags(me: User | null) {
  const userId = getUserId(me);
  
  const is_admin = await prisma.userSettings
    .findUnique({
      where: {
        user_id: userId || "",
      },
      select: {
        is_admin: true,
      },
    })
    .then((settings) => settings?.is_admin || false);

  const latest_kofi_payment = await prisma.koFiPayment.findFirst({
    where: {
      user_id: userId || "",
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
      effective_date: true,
    },
  });

  const enabledFlags = await prisma.featureFlag.findMany({
    where: {
      OR: [
        {
          active: true,
          OR: [
            { effective_date: null },
            { effective_date: { lte: new Date() } },
          ],
        },
        {
          active_for: {
            some: {
              user_id: userId || "",
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

  const payload: { [key: string]: boolean } = {};

  for (const flag of flags) {
    if (flag.name === "maintenance" && is_admin) {
      payload[flag.name] = false;
      continue;
    }

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
