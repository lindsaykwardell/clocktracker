import { PrismaClient, PrivacySetting } from "@prisma/client";
import { GameRecord } from "~/server/utils/anonymizeGame";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const role_id = handler.context.params!.role_id;

  console.log(role_id);

  const games = await prisma.game.findMany({
    where: {
      OR: [
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
          },
        },
        {
          privacy: PrivacySetting.PUBLIC,
        },
      ],
      player_characters: {
        some: {
          role_id,
        },
      },
    },
    include: {
      user: {
        select: {
          privacy: true,
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
    take: 12,
    orderBy: {
      date: "desc",
    },
  });

  const returnGames: GameRecord[] = [];
  for (const game of games) {
    returnGames.push(await anonymizeGame(game as GameRecord, null, false)); // always default to anonymous when loading on a role page
  }

  return returnGames;
});
