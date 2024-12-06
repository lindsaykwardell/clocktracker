import type { User } from "@supabase/supabase-js";
import { Alignment, PrismaClient } from "@prisma/client";
import { fetchGame } from "~/server/utils/fetchGames";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id as string;
  const body = await readBody<{
    order: number;
  }>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body || !body.order) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const userDetails = await prisma.userSettings.findUnique({
    where: {
      user_id: user.id,
    },
  });

  if (!userDetails) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  /** Reasons to disallow claimining the seat:
   * 2. The user is not a friend of the game creator
   * 3. The user is not in a community with the game creator
   * 4. The user is a storyteller
   * 5. The user is a co-storyteller
   * 6. The user already has a seat in the grimoire
   */

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      OR: [
        {
          user: {
            friends: {
              some: {
                friend_id: user.id,
              },
            },
          },
        },
        {
          community: {
            members: {
              some: {
                user_id: user.id,
              },
            },
          },
        },
      ],
      storyteller: {
        not: `@${userDetails.username}`,
      },
      AND: {
        OR: [
          {
            NOT: {
              co_storytellers: {
                has: `@${userDetails.username}`,
              },
            },
          },
          {
            co_storytellers: {
              isEmpty: true,
            },
          },
          {
            co_storytellers: {
              equals: null,
            },
          },
        ],
      },
      grimoire: {
        some: {
          tokens: {
            none: {
              player_id: user.id,
            },
          },
        },
      },
    },
    include: {
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

  if (!game) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Update the grimoire to tag the user as the player in the correct seat

  await prisma.token.updateMany({
    where: {
      order: body.order,
      grimoire: {
        game: {
          some: {
            id: gameId,
          },
        },
      },
    },
    data: {
      player_id: user.id,
      player_name: userDetails.display_name,
    },
  });

  // Reduce grimoire to find all tokens that have this player_id
  const player_characters = game.grimoire.reduce(
    (acc, g) => {
      const tokens = g.tokens?.filter((t) => t.player_id === user.id);
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
    await prisma.game.create({
      data: {
        ...game,
        id: undefined,
        community: undefined,
        associated_script: undefined,
        user: undefined,
        parent_game: undefined,
        parent_game_id: game.parent_game_id || game.id,
        child_games: undefined,
        user_id: user.id,
        player_characters: {
          create: [...player_characters],
        },
        demon_bluffs: {
          create: [
            ...game.demon_bluffs.map((d) => ({
              ...d,
              id: undefined,
              game_id: undefined,
            })),
          ],
        },
        fabled: {
          create: [
            ...game.fabled.map((f) => ({
              ...f,
              id: undefined,
              game_id: undefined,
            })),
          ],
        },
        // map the already created grimoires to the new game
        grimoire: {
          connect: game.grimoire.map((g) => ({ id: g.id })),
        },
        waiting_for_confirmation: false,
        is_storyteller: false,
      },
    });
  } catch (err: any) {
    const messageLines = err.message.split("\n");
    const message =
      messageLines[messageLines.length - 1].length > 0
        ? messageLines[messageLines.length - 1]
        : err.message;
    // get the name from the game.grimoire
    const taggedPlayer =
      game.grimoire
        .flatMap((g) => g.tokens)
        .find((t) => t.player_id === user.id)?.player_name || "Unknown";

    console.error(`Error saving for ${taggedPlayer}: ${message}`);

    throw createError({
      status: 500,
      statusMessage: `Error saving for ${taggedPlayer}: ${message}`,
    });
  }

  return fetchGame(gameId, user, false);
});
