import type { Prisma } from "~/server/generated/prisma/client";
import { reminderTokenWithType } from "~/server/utils/reminderTokenLinks";

/**
 * Saves the game's grimoire as it is now as a revision, for "Restore from
 * history". An editor save calls it before writing the new grimoire; the
 * background fill calls it before repairing seat numbers, with a `message`
 * saying why (shown in the history). Nothing is saved for a game without a
 * grimoire.
 */
export async function saveGrimoireRevision(
  tx: Prisma.TransactionClient,
  gameId: string,
  message: string | null = null
) {
  const game = await tx.game.findUnique({
    where: { id: gameId },
    select: {
      player_count: true,
      traveler_count: true,
      end_trigger: true,
      end_trigger_type: true,
      end_trigger_cause: true,
      end_trigger_role_id: true,
      end_trigger_subtype: true,
      end_trigger_note: true,
      end_trigger_participant_id: true,
      end_trigger_participant_alignment: true,
      grimoire_events: true,
    },
  });
  if (!game) return null;

  const existingGrimoires = await tx.grimoire.findMany({
    where: {
      game: { some: { id: gameId } },
    },
    orderBy: {
      id: "asc",
    },
    include: {
      tokens: {
        orderBy: {
          order: "asc",
        },
        include: {
          role: true,
          related_role: true,
          reminders: reminderTokenWithType,
        },
      },
    },
  });

  if (existingGrimoires.length === 0) return null;

  return tx.grimoireSnapshot.create({
    data: {
      game_id: gameId,
      message,
      snapshot: JSON.parse(JSON.stringify({
        pages: existingGrimoires.map((grimoire) => ({
          id: grimoire.id,
          title: grimoire.title,
          page_type: grimoire.page_type,
          lifetimes_applied: grimoire.lifetimes_applied,
          tokens: grimoire.tokens.map((token) => ({
            id: token.id,
            role_id: token.role_id,
            role_name: token.role?.name ?? null,
            related_role_id: token.related_role_id,
            related_role_name: token.related_role?.name ?? null,
            alignment: token.alignment,
            is_dead: token.is_dead,
            used_ghost_vote: token.used_ghost_vote,
            order: token.order,
            player_name: token.player_name,
            player_id: token.player_id,
            grimoire_participant_id: token.grimoire_participant_id,
            reminders: token.reminders.map((r) => ({
              id: r.id,
              reminder: r.reminder,
              token_url: r.token_url,
              role_reminder_id: r.role_reminder_id,
              is_custom: r.is_custom,
              // For showing the snapshot; restoring uses the link above.
              type: r.role_reminder?.type ?? (r.is_custom ? "CUSTOM" : null),
            })),
          })),
        })),
        // The seats on each page are players + travellers; restoring
        // needs both counts to split them again.
        player_count: game.player_count,
        traveler_count: game.traveler_count,
        end_trigger: game.end_trigger,
        end_trigger_type: game.end_trigger_type,
        end_trigger_cause: game.end_trigger_cause,
        end_trigger_role_id: game.end_trigger_role_id,
        end_trigger_subtype: game.end_trigger_subtype,
        end_trigger_note: game.end_trigger_note,
        end_trigger_participant_id: game.end_trigger_participant_id,
        end_trigger_participant_alignment:
          game.end_trigger_participant_alignment ?? null,
        grimoire_events: game.grimoire_events.map((event) => ({
          grimoire_page: event.grimoire_page,
          participant_id: event.participant_id,
          event_type: event.event_type,
          cause: event.cause,
          by_participant_id: event.by_participant_id,
          player_name: event.player_name,
          role_id: event.role_id,
          by_role_id: event.by_role_id,
          old_role_id: event.old_role_id,
          new_role_id: event.new_role_id,
          old_alignment: event.old_alignment,
          new_alignment: event.new_alignment,
          status_source: event.status_source,
        })),
      })),
    },
  });
}
