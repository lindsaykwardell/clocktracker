import { Alignment, PrismaClient, WinStatus_V2 } from "@prisma/client";
import { winRateByRole } from "~/server/utils/stats";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const name = handler.context.params?.type as string;
  let { script, compared_to_role, game_size } = getQuery(handler) as {
    script?: string;
    compared_to_role?: string | string[];
    game_size?: "teensy" | "small" | "medium" | "large";
  };

  let game_size_query = {};

  switch (game_size) {
    case "teensy":
      game_size_query = {
        player_count: {
          lte: 6,
        },
      };
      break;
    case "small":
      game_size_query = {
        player_count: {
          gt: 6,
          lte: 9,
        },
      };
      break;
    case "medium":
      game_size_query = {
        player_count: {
          gt: 9,
          lte: 12,
        },
      };
      break;
    case "large":
      game_size_query = {
        player_count: {
          gt: 12,
        },
      };
      break;
  }

  if (typeof compared_to_role === "string") {
    compared_to_role = [compared_to_role];
  } else if (!Array.isArray(compared_to_role)) {
    compared_to_role = [];
  }

  const role = await prisma.role.findFirst({
    where: {
      name: {
        equals: decodeURIComponent(name),
        mode: "insensitive",
      },
    },
  });

  if (!role) {
    console.error(`Role not found for name ${name}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      AND: [
        {
          parent_game_id: null,
          script: {
            equals: script,
            mode: "insensitive",
          },
        },
        {
          OR: [
            {
              player_characters: {
                some: {
                  role_id: {
                    equals: role?.id,
                  },
                },
              },
            },
            {
              grimoire: {
                some: {
                  tokens: {
                    some: {
                      role_id: {
                        equals: role?.id,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        ...compared_to_role.map((role) => ({
          OR: [
            {
              player_characters: {
                some: {
                  name: {
                    equals: role,
                  },
                },
              },
            },
            {
              grimoire: {
                some: {
                  tokens: {
                    some: {
                      role: {
                        name: {
                          equals: role,
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        })),
        game_size_query,
      ],
    },
    include: {
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
              name: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      demon_bluffs: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
        },
      },
      fabled: {
        include: {
          role: {
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
              reminders: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  const win_count = winRateByRole(games as unknown as GameRecord[], role);

  const scripts = [...new Set(games.map((game) => game.script))];

  return {
    role,
    compared_to_role,
    win_loss: {
      total: win_count.total,
      win: win_count.win,
      loss: win_count.total - win_count.win,
      pct: +((win_count.win / win_count.total) * 100).toFixed(2) || 0,
    },
    scripts,
  };
});
