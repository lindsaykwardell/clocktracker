import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const gameId = handler.context.params?.id;
  const me: User | null = handler.context.user;
  const { id: gameToMergeWith } = await readBody<{ id: string }>(handler);

  if (!gameId || !me) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // To merge a game, we need to:
  // 1. Connect the parent grimoire to the game that's getting merged
  // 2. Connect the parent game to the game that's getting merged
  // 3. Update certain data points, such as:
  //    - Player count
  //    - Traveler count
  //    - Storyteller (if missing)
  //    - Location (if missing)
  //    - Community (if missing)
  // We don't want to lose personal things, such as images, character roles, etc.

  // Fetch the parent game from the existing child game
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: me.id,
      deleted: false,
    },
    select: {
      parent_game: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
          player_characters: {
            include: {
              role: {
                select: {
                  token_url: true,
                  type: true,
                  initial_alignment: true,
                },
              },
              related_role: {
                select: {
                  token_url: true,
                },
              },
            },
          },
          grimoire: {
            include: {
              tokens: {
                include: {
                  role: true,
                  related_role: true,
                },
              },
            },
            orderBy: {
              id: "asc",
            },
          },
          community: {
            select: {
              slug: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  // If somehow there isn't a parent game, throw
  if (!game?.parent_game) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Get the data we want to keep from the child game
  const gameToMergeWithData = await prisma.game.findUnique({
    where: {
      id: gameToMergeWith,
      user_id: me.id,
      deleted: false,
    },
    select: {
      player_count: true,
      traveler_count: true,
      storyteller: true,
      location: true,
      community_name: true,
    },
  });

  // Remove the old grimoire from the game to merge with
  await prisma.grimoire.deleteMany({
    where: {
      game: {
        some: {
          id: gameToMergeWith,
        },
      },
    },
  });

  // Merge the "game to merge with" to the parent game
  await prisma.game.update({
    where: {
      id: gameToMergeWith,
    },
    data: {
      parent_game_id: game.parent_game.id,
      grimoire: {
        connect: game.parent_game.grimoire.map((g) => ({ id: g.id })),
      },
      player_count: game.parent_game.player_count,
      traveler_count: game.parent_game.traveler_count,
      storyteller:
        gameToMergeWithData?.storyteller || game.parent_game.storyteller,
      location: gameToMergeWithData?.location || game.parent_game.location,
      community_name:
        gameToMergeWithData?.community_name || game.parent_game.community_name,
    },
  });

  // Delete the old child game
  await prisma.game.delete({
    where: {
      id: gameId,
    },
  });

  // Return the newly merged game
  return prisma.game.findUnique({
    where: {
      id: gameToMergeWith,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      community: {
        select: {
          slug: true,
        },
      },
    },
  });
});
