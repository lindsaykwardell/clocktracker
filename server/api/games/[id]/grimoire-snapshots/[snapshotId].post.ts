import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { Alignment } from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";

type SnapshotToken = {
  role_id: string | null;
  related_role_id: string | null;
  alignment: Alignment;
  is_dead: boolean;
  used_ghost_vote: boolean;
  order: number;
  player_name: string;
  player_id: string | null;
  reminders: {
    reminder: string;
    token_url: string;
  }[];
};

type SnapshotPage = {
  id: number;
  tokens: SnapshotToken[];
};

type SnapshotData = {
  pages: SnapshotPage[];
};

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;
  const snapshotId = handler.context.params?.snapshotId;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!gameId || !snapshotId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { user_id: true },
  });

  if (!game || game.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const snapshot = await prisma.grimoireSnapshot.findUnique({
    where: { id: parseInt(snapshotId) },
  });

  if (!snapshot || snapshot.game_id !== gameId) {
    throw createError({
      status: 404,
      statusMessage: "Snapshot not found",
    });
  }

  const data = snapshot.snapshot as unknown as SnapshotData;

  // Delete all current grimoires for this game
  const currentGrimoires = await prisma.grimoire.findMany({
    where: { game: { some: { id: gameId } } },
    select: { id: true },
  });

  for (const grim of currentGrimoires) {
    await prisma.token.deleteMany({ where: { grimoire_id: grim.id } });
    await prisma.grimoire.delete({ where: { id: grim.id } });
  }

  // Recreate all grimoire pages from the snapshot
  for (const page of data.pages) {
    await prisma.grimoire.create({
      data: {
        game: { connect: { id: gameId } },
        tokens: {
          create: page.tokens.map((token) => ({
            role_id: token.role_id,
            related_role_id: token.related_role_id,
            alignment: token.alignment,
            is_dead: token.is_dead,
            used_ghost_vote: token.used_ghost_vote,
            order: token.order,
            player_name: token.player_name,
            player_id: token.player_id,
            reminders: {
              create: token.reminders.map((r) => ({
                reminder: r.reminder,
                token_url: r.token_url,
              })),
            },
          })),
        },
      },
    });
  }

  // Return the updated game grimoires
  return prisma.grimoire.findMany({
    where: { game: { some: { id: gameId } } },
    include: {
      tokens: {
        include: {
          role: true,
          related_role: true,
          reminders: true,
          player: {
            select: {
              username: true,
              display_name: true,
            },
          },
        },
      },
    },
  });
});
