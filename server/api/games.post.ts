import type { User } from "@supabase/supabase-js";
import {
  type Game,
  type Character,
  type Token,
  type Grimoire,
  Alignment,
  type DemonBluff,
  type Fabled,
  type GrimoireEvent,
  GrimoireEventType,
  type ReminderToken,
} from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";
import {
  findOrCreatePlayerChildGame,
  findOrCreateStorytellerChildGame,
} from "~/server/utils/childGame";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

const MAX_GRIMOIRE_PAGE_TITLE_LENGTH = 64;

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<
    | (Game & {
        player_characters: (Character & { role?: { token_url: string } })[];
        demon_bluffs: (DemonBluff & { role?: { token_url: string } })[];
        fabled: (Fabled & { role?: { token_url: string } })[];
        grimoire_events?: GrimoireEvent[];
        grimoire: Partial<
          Grimoire & {
            tokens: Partial<
              Token & {
                reminders: Partial<ReminderToken>[];
              }
            >[];
          }
        >[];
      })
    | null
  >(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  if (
    body.grimoire.some(
      (page) => (page.title?.length ?? 0) > MAX_GRIMOIRE_PAGE_TITLE_LENGTH
    )
  ) {
    throw createError({
      status: 400,
      statusMessage: `Grimoire page title cannot exceed ${MAX_GRIMOIRE_PAGE_TITLE_LENGTH} characters.`,
    });
  }

  const {
    grimoire_events: _incomingEvents,
    ...gameData
  } = body as any;

  const incomingGrimoireEvents: GrimoireEvent[] = body.grimoire_events ?? [];

  const newGame = await prisma.game.create({
    data: {
      ...gameData,
      date: new Date(body.date),
      user_id: user.id,
      player_characters: {
        create: [...body.player_characters],
      },
      demon_bluffs: {
        create: [...body.demon_bluffs],
      },
      fabled: {
        create: [...body.fabled],
      },
      grimoire_events: {
        create:
          incomingGrimoireEvents.map((grimoireEvent) => ({
            grimoire_page: grimoireEvent.grimoire_page,
            participant_id: grimoireEvent.participant_id,
            event_type:
              grimoireEvent.event_type ??
              GrimoireEventType.NOT_RECORDED,
            cause: grimoireEvent.cause ?? null,
            by_participant_id: grimoireEvent.by_participant_id ?? null,
            player_name: grimoireEvent.player_name ?? "",
            role_id: grimoireEvent.role_id ?? null,
            by_role_id: grimoireEvent.by_role_id ?? null,
            old_role_id: (grimoireEvent as any).old_role_id ?? null,
            new_role_id: (grimoireEvent as any).new_role_id ?? null,
            old_alignment: (grimoireEvent as any).old_alignment ?? null,
            new_alignment: (grimoireEvent as any).new_alignment ?? null,
            status_source: (grimoireEvent as any).status_source ?? null,
          })) || [],
      },
      grimoire: {
        create: [
          ...body.grimoire.map((g) => ({
            ...g,
            tokens: {
              create: g.tokens?.map((token, index) => ({
                role_id: token.role_id,
                related_role_id: token.related_role_id,
                alignment: token.alignment || Alignment.NEUTRAL,
                is_dead: token.is_dead || false,
                used_ghost_vote: token.used_ghost_vote || false,
                order: token.order ?? index,
                grimoire_participant_id: token.grimoire_participant_id ?? null,
                player_name: token.player_name || "",
                player_id: token.player_id,
                reminders: {
                  create:
                    token.reminders?.map((reminder) => ({
                      reminder: reminder.reminder,
                      token_url: reminder.token_url,
                      type: reminder.type ?? undefined,
                    })) || [],
                },
              })),
            },
          })),
        ],
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      player_characters: true,
      demon_bluffs: true,
      fabled: true,
      grimoire_events: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          by_role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
        },
      },
      end_trigger_role: {
        select: {
          token_url: true,
          type: true,
          initial_alignment: true,
          name: true,
        },
      },
      grimoire: {
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
      },
      associated_script: {
        select: {
          version: true,
          script_id: true,
          is_custom_script: true,
          logo: true,
        },
      },
    },
  });

  const taggedPlayers = new Set(
    newGame.grimoire.flatMap((g) => g.tokens?.map((t) => t.player_id)),
  );

  for (const id of taggedPlayers) {
    if (!id || id === user.id) continue;

    // Reduce grimoire to find all tokens that have this player_id
    const player_characters = newGame.grimoire.reduce(
      (acc, g) => {
        const tokens = g.tokens?.filter((t) => t.player_id === id);
        if (tokens) {
          for (const token of tokens) {
            // Avoid duplicating identical consecutive tokens (same role/related/alignment)
            const lastToken = acc[acc.length - 1];
            if (
              lastToken &&
              lastToken.role_id === token.role_id &&
              lastToken.related_role_id === token.related_role_id &&
              lastToken.alignment === token.alignment
            ) {
              continue;
            }

            acc.push({
              name: token.role?.name || "",
              alignment: token.alignment,
              related: token.related_role?.name || "",
              role_id: token.role_id,
              related_role_id: token.related_role_id,
            });
          }
        }

        return acc;
      },
      [] as {
        name: string;
        alignment: Alignment;
        related: string;
        role_id: string | null;
        related_role_id: string | null;
      }[],
    );

    try {
      await findOrCreatePlayerChildGame({
        game: newGame,
        playerId: id,
        playerCharacters: player_characters,
        relatedGames: [], // new game has no children yet
      });
    } catch (err: any) {
      const taggedPlayer =
        newGame.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id === id)
          ?.player_name || "Unknown";
      console.error(`Error creating child game for ${taggedPlayer}: ${err.message}`);
    }
  }

  // Notify tagged players
  const playerIdsToNotify = [...taggedPlayers].filter((id): id is string => !!id && id !== user.id);
  if (playerIdsToNotify.length > 0) {
    void sendPushNotifications({
      userIds: playerIdsToNotify,
      title: "You've been tagged in a game",
      body: `${newGame.user.username} tagged you in a game of ${newGame.script}`,
      url: `/@${newGame.user.username}`,
    });
  }

  const storytellers = [newGame.storyteller, ...newGame.co_storytellers];

  for (const storyteller of storytellers) {
    if (storyteller?.includes("@")) {
      // Verify that it's a friend
      const friend = await prisma.userSettings.findUnique({
        where: {
          username: storyteller.replace("@", ""),
          friends: {
            some: {
              user_id: user.id,
            },
          },
        },
      });

      if (friend !== null) {
        try {
          await findOrCreateStorytellerChildGame({
            game: newGame,
            storytellerUserId: friend.user_id,
            childGames: [], // new game has no children yet
          });
        } catch (err: any) {
          console.error(`Error creating storyteller child game for ${storyteller}: ${err.message}`);
        }

        void sendPushNotifications({
          userIds: [friend.user_id],
          title: "You've been tagged as storyteller",
          body: `${newGame.user.username} tagged you as storyteller in a game of ${newGame.script}`,
          url: `/@${newGame.user.username}`,
        });
      }
    }
  }

  return newGame;
});
