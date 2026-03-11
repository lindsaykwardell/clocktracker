import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { type Game, type Character, type Token, type Grimoire, Alignment, type DemonBluff, type Fabled } from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";
import {
  findOrCreatePlayerChildGame,
  findOrCreateStorytellerChildGame,
} from "~/server/utils/childGame";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<
    | (Game & {
        player_characters: (Character & { role?: { token_url: string } })[];
        demon_bluffs: (DemonBluff & { role?: { token_url: string } })[];
        fabled: (Fabled & { role?: { token_url: string } })[];
        grimoire: Partial<
          Grimoire & {
            tokens: Partial<
              Token & {
                reminders: Partial<{ reminder: string; token_url: string }>[];
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

  const newGame = await prisma.game.create({
    data: {
      ...body,
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

    await findOrCreatePlayerChildGame({
      game: newGame,
      playerId: id,
      playerCharacters: player_characters,
      relatedGames: [], // new game has no children yet
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
        await findOrCreateStorytellerChildGame({
          game: newGame,
          storytellerUserId: friend.user_id,
          childGames: [], // new game has no children yet
        });
      }
    }
  }

  return newGame;
});
