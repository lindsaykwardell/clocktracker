import type { User } from "@supabase/supabase-js";
import {
  Game,
  Character,
  Token,
  Grimoire,
  Alignment,
  DemonBluff,
  Fabled,
  GrimoireEvent,
  ReminderToken,
} from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";
import {
  mapGrimoireEventsForCreate,
  getTaggedPlayerIds,
  buildPlayerCharactersForToken,
} from "~/server/utils/gamePropagation";

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

  const {
    grimoire_events: _incomingEvents,
    ...gameData
  } = body as any;

  const incomingGrimoireEvents: GrimoireEvent[] = body.grimoire_events ?? [];

  const newGame = await prisma.$transaction(async (tx) => {
    const newGame = await tx.game.create({
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
        create: mapGrimoireEventsForCreate(incomingGrimoireEvents),
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

  const taggedPlayers = getTaggedPlayerIds(newGame.grimoire, user.id);

  for (const id of taggedPlayers) {
    const player_characters = buildPlayerCharactersForToken(
      newGame.grimoire,
      id,
    );

    await tx.game.create({
      data: {
        ...gameData,
        is_storyteller: false,
        storyteller:
          newGame.is_storyteller && newGame.user
            ? `@${newGame.user.username}`
            : newGame.storyteller,
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
        grimoire_events: {
          create: mapGrimoireEventsForCreate(incomingGrimoireEvents),
        },
        notes: "",
        // map the already created grimoires to the new game
        grimoire: {
          connect: newGame.grimoire.map((g) => ({ id: g.id })),
        },
        parent_game_id: newGame.id,
        waiting_for_confirmation: true,
        tags: [],
      },
    });
  }

  const storytellers = [newGame.storyteller, ...newGame.co_storytellers];

  for (const storyteller of storytellers) {
    if (storyteller?.includes("@")) {
      // Verify that it's a friend
      const friend = await tx.userSettings.findUnique({
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
        await tx.game.create({
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
            grimoire_events: {
              create: mapGrimoireEventsForCreate(incomingGrimoireEvents),
            },
            notes: "",
            grimoire: {
              connect: newGame.grimoire.map((g) => ({ id: g.id })),
            },
            parent_game_id: newGame.id,
            waiting_for_confirmation: true,
            tags: [],
          },
        });
      }
    }
  }

    return newGame;
  });

  return newGame;
});
