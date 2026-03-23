import type { User } from "@supabase/supabase-js";
import {
  Game,
  Character,
  Grimoire,
  Token,
  Alignment,
  DemonBluff,
  Fabled,
  ReminderToken,
  GrimoireEvent,
  GrimoireEventType,
} from "@prisma/client";
import { prisma } from "~/server/utils/prisma";

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
    },
  });

  if (!existingGame || existingGame.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
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

    const relatedGame = related_games?.find((g) => g!.user_id === id);

    try {
      if (!relatedGame) {
        await prisma.game.create({
          data: {
            ...gameData,
            date: new Date(body.date),
            user_id: id,
            player_characters: {
              create: [...player_characters],
            },
            demon_bluffs: {
              create: [...body.demon_bluffs],
            },
            fabled: {
              create: [...body.fabled],
            },
            // map the already created grimoires to the new game
            grimoire: {
              connect: game.grimoire.map((g) => ({ id: g.id })),
            },
            parent_game_id: game.parent_game_id || game.id,
            waiting_for_confirmation: true,
            is_storyteller: false,
            storyteller:
              game.is_storyteller && game.user
                ? `@${game.user.username}`
                : game.storyteller,
          },
        });
      } else {
        await prisma.game.update({
          where: {
            id: relatedGame.id,
          },
          data: {
            date: new Date(body.date),
            script: body.script,
            script_id: body.script_id,
            location_type: body.location_type,
            location: body.location,
            community_name: body.community_name,
            community_id: body.community_id,
            player_count: body.player_count,
            traveler_count: body.traveler_count,
            storyteller: body.storyteller,
            co_storytellers: body.co_storytellers,
            win_v2: body.win_v2,
            end_trigger: body.end_trigger,
            end_trigger_type: body.end_trigger_type,
            end_trigger_cause: body.end_trigger_cause,
            end_trigger_role_id: body.end_trigger_role_id,
            end_trigger_note: body.end_trigger_note,
            end_trigger_participant_id: body.end_trigger_participant_id,
            ls_game_id: body.ls_game_id,
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
            demon_bluffs: {
              deleteMany: relatedGame.demon_bluffs.map((g) => ({ id: g.id })),
              create: game.demon_bluffs.map((g) => ({
                ...g,
                id: undefined,
                game_id: undefined,
              })),
            },
            fabled: {
              deleteMany: relatedGame.fabled.map((g) => ({ id: g.id })),
              create: game.fabled.map((g) => ({
                ...g,
                id: undefined,
                game_id: undefined,
              })),
            },
            player_characters: {
              deleteMany: relatedGame.player_characters.map((g) => ({
                id: g.id,
              })),
              create: player_characters,
            },
            grimoire: {
              connect: game.grimoire.map((g) => ({ id: g.id })),
            },
          },
        });
      }
    } catch (err: any) {
      const messageLines = err.message.split("\n");
      const message =
        messageLines[messageLines.length - 1].length > 0
          ? messageLines[messageLines.length - 1]
          : err.message;
      // get the name from the game.grimoire
      const taggedPlayer =
        game.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id === id)
          ?.player_name || "Unknown";

      console.error(`Error saving for ${taggedPlayer}: ${message}`);

      throw createError({
        status: 500,
        statusMessage: `Error saving for ${taggedPlayer}: ${message}`,
      });
    }
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
        const childGame = game.child_games?.find(
          (g) => g.user_id === friend.user_id
        );

        if (!childGame) {
          await prisma.game.create({
            data: {
              ...gameData,
              is_storyteller: true,
              date: new Date(body.date),
              user_id: friend.user_id,
              player_characters: {},
              demon_bluffs: {
                create: [...body.demon_bluffs],
              },
              fabled: {
                create: [...body.fabled],
              },
              notes: "",
              grimoire: {
                connect: game.grimoire.map((g) => ({ id: g.id })),
              },
              parent_game_id: game.id,
              waiting_for_confirmation: true,
              tags: [],
            },
          });
        } else {
          await prisma.game.update({
            where: {
              id: childGame.id,
            },
            data: {
              date: new Date(body.date),
              script: body.script,
              script_id: body.script_id,
              location_type: body.location_type,
              location: body.location,
              community_name: body.community_name,
              community_id: body.community_id,
              player_count: body.player_count,
              traveler_count: body.traveler_count,
              storyteller: body.storyteller,
              co_storytellers: body.co_storytellers,
              win_v2: body.win_v2,
              end_trigger: body.end_trigger,
              end_trigger_type: body.end_trigger_type,
              end_trigger_cause: body.end_trigger_cause,
              end_trigger_role_id: body.end_trigger_role_id,
              end_trigger_note: body.end_trigger_note,
              end_trigger_participant_id: body.end_trigger_participant_id,
              ls_game_id: body.ls_game_id,
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
              demon_bluffs: {
                deleteMany: childGame.demon_bluffs.map((g) => ({ id: g.id })),
                create: game.demon_bluffs.map((g) => ({
                  ...g,
                  id: undefined,
                  game_id: undefined,
                })),
              },
              fabled: {
                deleteMany: childGame.fabled.map((g) => ({ id: g.id })),
                create: game.fabled.map((g) => ({
                  ...g,
                  id: undefined,
                  game_id: undefined,
                })),
              },
              grimoire: {
                connect: game.grimoire.map((g) => ({ id: g.id })),
              },
            },
          });
        }
      }
    }
  }

  return game;
});
