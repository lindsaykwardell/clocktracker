import type { User } from "@supabase/supabase-js";
import {
  type Game,
  type Character,
  type Grimoire,
  type Token,
  Alignment,
  type DemonBluff,
  type Fabled,
  type ReminderToken,
  type GrimoireEvent,
  GrimoireEventType,
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
  const gameId = handler.context.params?.id;
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

  if (!gameId) {
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

  const existingGame = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      player_characters: true,
      demon_bluffs: true,
      fabled: true,
      grimoire_events: true,
    },
  });

  if (!existingGame || existingGame.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Snapshot existing grimoire state before any modifications
  const existingGrimoires = await prisma.grimoire.findMany({
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
          reminders: true,
        },
      },
    },
  });

  if (existingGrimoires.length > 0) {
    await prisma.grimoireSnapshot.create({
      data: {
        game_id: gameId,
        snapshot: JSON.parse(JSON.stringify({
          pages: existingGrimoires.map((grimoire) => ({
            id: grimoire.id,
            title: grimoire.title,
            page_type: grimoire.page_type,
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
              grimoire_participant_id: token.grimoire_participant_id,
              player_name: token.player_name,
              player_id: token.player_id,
              reminders: token.reminders.map((r) => ({
                id: r.id,
                reminder: r.reminder,
                token_url: r.token_url,
                type: r.type,
              })),
            })),
          })),
          end_trigger: existingGame.end_trigger,
          end_trigger_type: existingGame.end_trigger_type,
          end_trigger_cause: existingGame.end_trigger_cause,
          end_trigger_role_id: existingGame.end_trigger_role_id,
          end_trigger_subtype: existingGame.end_trigger_subtype,
          end_trigger_note: existingGame.end_trigger_note,
          end_trigger_participant_id: existingGame.end_trigger_participant_id,
          grimoire_events: existingGame.grimoire_events.map((event) => ({
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

  const game = await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      ...gameData,
      date: new Date(body.date),
      user_id: user.id,
      player_characters: {
        deleteMany: {
          id: {
            in: existingGame.player_characters.map((character) => character.id),
          },
        },
        create: [...body.player_characters],
      },
      demon_bluffs: {
        deleteMany: {
          id: {
            in: existingGame.demon_bluffs.map((bluff) => bluff.id),
          },
        },
        create: [...body.demon_bluffs],
      },
      fabled: {
        deleteMany: {
          id: {
            in: existingGame.fabled.map((fabled) => fabled.id),
          },
        },
        create: [...body.fabled],
      },
      grimoire_events: {
        deleteMany: {},
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
        deleteMany: {
          id: {
            notIn: body.grimoire.filter((g) => !!g.id).map((g) => g.id!),
          },
        },
        create: [
          ...body.grimoire
            .filter((g) => !g.id)
            .map((g) => ({
              title: g.title ?? "",
              page_type: g.page_type ?? "NONE",
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
        update: [
          ...body.grimoire
            .filter((g) => g.id)
            .map((g) => ({
              where: {
                id: g.id,
              },
              data: {
                title: g.title ?? "",
                page_type: g.page_type ?? "NONE",
                tokens: {
                  deleteMany: {
                    id: {
                      notIn: g.tokens
                        ?.filter((token) => !!token.id)
                        .map((token) => token.id!),
                    },
                  },
                  create: g.tokens
                    ?.filter((token) => !token.id)
                    .map((token, index) => ({
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
                  update: g.tokens
                    ?.filter((token) => token.id)
                    .map((token, index) => ({
                      where: {
                        id: token.id,
                      },
                      data: {
                        role_id: token.role_id ?? null,
                        related_role_id: token.related_role_id ?? null,
                        alignment: token.alignment || Alignment.NEUTRAL,
                        is_dead: token.is_dead || false,
                        used_ghost_vote: token.used_ghost_vote || false,
                        order: token.order ?? index,
                        grimoire_participant_id: token.grimoire_participant_id ?? null,
                        player_name: token.player_name || "",
                        player_id: token.player_id ?? null,
                        reminders: {
                          deleteMany: {
                            id: {
                              notIn: token.reminders
                                ?.filter((reminder) => !!reminder.id)
                                .map((reminder) => reminder.id!),
                            },
                          },
                          create: token.reminders
                            ?.filter((reminder) => !reminder.id)
                            .map((reminder) => ({
                              reminder: reminder.reminder,
                              token_url: reminder.token_url,
                              type: reminder.type ?? undefined,
                            })),
                          update: token.reminders
                            ?.filter((reminder) => reminder.id)
                            .map((reminder) => ({
                              where: {
                                id: reminder.id,
                              },
                              data: {
                                reminder: reminder.reminder,
                                token_url: reminder.token_url,
                                type: reminder.type ?? undefined,
                              },
                            })),
                        },
                      },
                    })),
                },
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
      grimoire_events: true,
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
      child_games: {
        include: {
          demon_bluffs: true,
          fabled: true,
          player_characters: true,
        },
      },
      parent_game: {
        include: {
          player_characters: true,
          demon_bluffs: true,
          fabled: true,
          child_games: {
            include: {
              player_characters: true,
              demon_bluffs: true,
              fabled: true,
            },
          },
        },
      },
      community: {
        select: {
          slug: true,
          icon: true,
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

  const related_games = [...game.child_games];

  if (game.parent_game) {
    related_games.push(game.parent_game);
    related_games.push(...game.parent_game.child_games);
  }

  const taggedPlayers = new Set(
    game.grimoire.flatMap((g) => g.tokens?.map((t) => t.player_id))
  );

  for (const id of taggedPlayers) {
    if (!id || id === user.id) continue;

    // Reduce grimoire to find all tokens that have this player_id
    const player_characters = game.grimoire.reduce(
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
      }[]
    );

    try {
      await findOrCreatePlayerChildGame({
        game,
        playerId: id,
        playerCharacters: player_characters,
        relatedGames: related_games,
      });
    } catch (err: any) {
      const taggedPlayer =
        game.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id === id)
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
      body: `${game.user.username} tagged you in a game of ${game.script}`,
      url: `/@${game.user.username}`,
    });
  }

  const storytellers = [game.storyteller, ...game.co_storytellers];

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
            game,
            storytellerUserId: friend.user_id,
            childGames: game.child_games,
          });
        } catch (err: any) {
          console.error(`Error creating storyteller child game for ${storyteller}: ${err.message}`);
        }

        void sendPushNotifications({
          userIds: [friend.user_id],
          title: "You've been tagged as storyteller",
          body: `${game.user.username} tagged you as storyteller in a game of ${game.script}`,
          url: `/@${game.user.username}`,
        });
      }
    }
  }

  return game;
});
