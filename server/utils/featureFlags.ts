import { PrismaClient } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { createHash } from "crypto";
import { prisma } from "./prisma";

/**
 * Deterministically check if a user falls within a rollout percentage for a flag.
 * Uses SHA-256 of (userId + flagName) so the same user consistently gets the same
 * result for a given flag, but different results across different flags.
 */
function isInRollout(userId: string, flagName: string, percentage: number): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  const hash = createHash("sha256").update(userId + flagName).digest();
  // Use first 4 bytes as a uint32, mod 100 gives 0-99
  const bucket = hash.readUInt32BE(0) % 100;
  return bucket < percentage;
}

export async function getFeatureFlags(me: User | null) {
  const is_admin = await prisma.userSettings
    .findUnique({
      where: {
        user_id: me?.id || "",
      },
      select: {
        is_admin: true,
      },
    })
    .then((settings) => settings?.is_admin || false);

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
      effective_date: true,
      rollout_percentage: true,
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

  const payload: { [key: string]: boolean } = {};

  for (const flag of flags) {
    if (flag.name === "maintenance" && is_admin) {
      payload[flag.name] = false;
      continue;
    }

    const explicitlyEnabled = enabledFlags.some(
      (enabledFlag) => enabledFlag.id === flag.id
    );

    // Check percentage-based rollout if not already enabled by other means
    const inRollout =
      !explicitlyEnabled &&
      me?.id &&
      flag.rollout_percentage != null &&
      isInRollout(me.id, flag.name, flag.rollout_percentage);

    payload[flag.name] = explicitlyEnabled || !!inRollout;
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
