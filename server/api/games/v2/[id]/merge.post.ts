import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";
import { fetchGame } from "~/server/utils/fetchGames";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const gameId = handler.context.params?.id;
  const me: User | null = handler.context.user;
  const { id: gameToMergeWith } = await readBody<{ id: string }>(handler);

  if (!gameId || !me) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  /**
   * Problem: We have two games. We want one.
   * Original solution: Update a few details in `gameToMergeWith` and then delete `game`.
   * Problem with original solution: We sometimes lose the grimoire. This is _bad_.
   *
   * New solution: Keep `game`, update a few details from `gameToMergeWith`, and then delete `gameToMergeWith`.
   *
   * Steps:
   * 1. Fetch `game` and `gameToMergeWith`
   */

  // Fetch the parent game from the existing child game
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: me.id,
      deleted: false,
    },
    select: {
      tags: true,
    },
  });

  // If somehow there isn't a parent game, throw
  if (!game) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Fetch the gameToMergeWith details we care about
  // notes, attachments, privacy.

  const gameToMergeWithDetails = await prisma.game.findUnique({
    where: {
      id: gameToMergeWith,
      user_id: me.id,
      deleted: false,
    },
    select: {
      id: true,
      notes: true,
      image_urls: true,
      privacy: true,
      tags: true,
    },
  });

  // If somehow there isn't a gameToMergeWith, throw
  if (!gameToMergeWithDetails) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Update the game with the details from gameToMergeWith
  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      notes: gameToMergeWithDetails.notes,
      image_urls: gameToMergeWithDetails.image_urls,
      privacy: gameToMergeWithDetails.privacy,
      tags: [...gameToMergeWithDetails.tags, ...game.tags],
      waiting_for_confirmation: false,
    },
  });

  // Delete the gameToMergeWith
  await prisma.game.update({
    where: {
      id: gameToMergeWith,
    },
    data: {
      deleted: true,
    },
  });

  // Return the newly merged game
  return fetchGame(gameId, me);
});
