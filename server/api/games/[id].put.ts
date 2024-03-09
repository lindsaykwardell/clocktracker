import type { User } from "@supabase/supabase-js";
import {
  PrismaClient,
  Game,
  Character,
  Grimoire,
  Token,
  WinStatus,
  Alignment,
  DemonBluff,
  Fabled,
  ReminderToken,
} from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;
  const body = await readBody<
    | (Game & {
        player_characters: (Character & { role?: { token_url: string } })[];
        demon_bluffs: (DemonBluff & { role?: { token_url: string } })[];
        fabled: (Fabled & { role?: { token_url: string } })[];
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
      ...body,
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
              tokens: {
                create: g.tokens?.map((token, index) => ({
                  role_id: token.role_id,
                  related_role_id: token.related_role_id,
                  alignment: token.alignment || Alignment.NEUTRAL,
                  is_dead: token.is_dead || false,
                  used_ghost_vote: token.used_ghost_vote || false,
                  order: token.order || index,
                  player_name: token.player_name || "",
                  player_id: token.player_id,
                  reminders: {
                    create:
                      token.reminders?.map((reminder) => ({
                        reminder: reminder.reminder,
                        token_url: reminder.token_url,
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
                ...g,
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
                      order: token.order || index,
                      player_name: token.player_name || "",
                      player_id: token.player_id,
                      reminders: {
                        create:
                          token.reminders?.map((reminder) => ({
                            reminder: reminder.reminder,
                            token_url: reminder.token_url,
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
                        role_id: token.role_id,
                        related_role_id: token.related_role_id,
                        alignment: token.alignment || Alignment.NEUTRAL,
                        is_dead: token.is_dead || false,
                        used_ghost_vote: token.used_ghost_vote || false,
                        order: token.order || index,
                        player_name: token.player_name || "",
                        player_id: token.player_id,
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
      player_characters: true,
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
                }
              }
            },
          },
        },
      },
      child_games: true,
      parent_game: {
        include: {
          child_games: true,
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
        },
      },
    },
  });

  const related_games = [...game.child_games];

  if (game.parent_game) {
    related_games.push(game.parent_game);
    related_games.push(...game.parent_game.child_games);
  }

  const parentGameLastAlignment =
    game.player_characters[game.player_characters.length - 1]?.alignment ||
    Alignment.NEUTRAL;

  const taggedPlayers = new Set(
    game.grimoire.flatMap((g) => g.tokens?.map((t) => t.player_id))
  );

  for (const id of taggedPlayers) {
    if (!id || id === user.id) continue;

    // Reduce grimoire to find all tokens that have this player_id
    const player_characters = game.grimoire.reduce((acc, g) => {
      const tokens = g.tokens?.filter((t) => t.player_id === id);
      if (tokens) {
        for (const token of tokens) {
          // Don't add the token if it's identical to the last token
          // in the player_characters array

          const lastToken = acc[acc.length - 1];
          if (
            lastToken &&
            lastToken.role_id === token.role_id &&
            lastToken.related_role_id === token.related_role_id
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
    }, [] as { name: string; alignment: Alignment; related: string; role_id: string | null; related_role_id: string | null }[]);

    const relatedGame = related_games?.find((g) => g!.user_id === id);

    if (!relatedGame) {
      const lastAlignment =
        player_characters[player_characters.length - 1].alignment;

      const win = (() => {
        if (parentGameLastAlignment === Alignment.NEUTRAL) {
          if (lastAlignment === Alignment.GOOD) {
            return game.win === WinStatus.WIN;
          } else {
            return game.win === WinStatus.LOSS;
          }
        }

        if (lastAlignment === parentGameLastAlignment) {
          return game.win === WinStatus.WIN;
        } else {
          return game.win === WinStatus.LOSS;
        }
      })();

      await prisma.game.create({
        data: {
          ...body,
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
          win: win ? WinStatus.WIN : WinStatus.LOSS,
        },
      });
    } else {
      await prisma.game.update({
        where: {
          id: relatedGame.id,
        },
        data: {
          grimoire: {
            connect: game.grimoire.map((g) => ({ id: g.id })),
          },
        },
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
          const win = (() => {
            if (parentGameLastAlignment === Alignment.GOOD) {
              return game.win;
            } else {
              return !game.win;
            }
          })();

          await prisma.game.create({
            data: {
              ...body,
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
              win: win ? WinStatus.WIN : WinStatus.LOSS,
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
