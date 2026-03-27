import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { Alignment } from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";

type SnapshotToken = {
  grimoire_participant_id?: string | null;
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
    type?: string;
  }[];
};

type SnapshotPage = {
  id: number;
  title?: string;
  page_type?: string;
  tokens: SnapshotToken[];
};

type SnapshotData = {
  pages: SnapshotPage[];
  end_trigger?: string | null;
  end_trigger_type?: string | null;
  end_trigger_cause?: string | null;
  end_trigger_role_id?: string | null;
  end_trigger_note?: string | null;
  end_trigger_participant_id?: string | null;
  grimoire_events?: {
    grimoire_page: number;
    participant_id: string;
    event_type?: string | null;
    cause?: string | null;
    by_participant_id?: string | null;
    player_name?: string | null;
    role_id?: string | null;
    by_role_id?: string | null;
    old_role_id?: string | null;
    new_role_id?: string | null;
    old_alignment?: string | null;
    new_alignment?: string | null;
    status_source?: string | null;
  }[];
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
        title: page.title ?? "",
        page_type: (page.page_type as any) ?? "NONE",
        tokens: {
          create: page.tokens.map((token) => ({
            grimoire_participant_id: token.grimoire_participant_id ?? null,
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
                type: (r.type as any) ?? undefined,
              })),
            },
          })),
        },
      },
    });
  }

  const gameUpdateData: Record<string, any> = {};
  if ("end_trigger" in data) gameUpdateData.end_trigger = data.end_trigger as any;
  if ("end_trigger_type" in data)
    gameUpdateData.end_trigger_type = data.end_trigger_type as any;
  if ("end_trigger_cause" in data)
    gameUpdateData.end_trigger_cause = data.end_trigger_cause as any;
  if ("end_trigger_role_id" in data)
    gameUpdateData.end_trigger_role_id = data.end_trigger_role_id ?? null;
  if ("end_trigger_note" in data)
    gameUpdateData.end_trigger_note = data.end_trigger_note ?? "";
  if ("end_trigger_participant_id" in data) {
    gameUpdateData.end_trigger_participant_id =
      data.end_trigger_participant_id ?? null;
  }
  if (Array.isArray(data.grimoire_events)) {
    gameUpdateData.grimoire_events = {
      deleteMany: {},
      create: data.grimoire_events.map((event) => ({
        grimoire_page: event.grimoire_page,
        participant_id: event.participant_id,
        event_type: (event.event_type as any) ?? "NOT_RECORDED",
        cause: (event.cause as any) ?? null,
        by_participant_id: event.by_participant_id ?? null,
        player_name: event.player_name ?? "",
        role_id: event.role_id ?? null,
        by_role_id: event.by_role_id ?? null,
        old_role_id: event.old_role_id ?? null,
        new_role_id: event.new_role_id ?? null,
        old_alignment: (event.old_alignment as any) ?? null,
        new_alignment: (event.new_alignment as any) ?? null,
        status_source: event.status_source ?? null,
      })),
    };
  }

  if (Object.keys(gameUpdateData).length > 0) {
    await prisma.game.update({
      where: { id: gameId },
      data: gameUpdateData,
    });
  }

  // Return the updated game grimoires
  return prisma.grimoire.findMany({
    where: { game: { some: { id: gameId } } },
    orderBy: { id: "asc" },
    include: {
      tokens: {
        orderBy: { order: "asc" },
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
