import { PrismaClient, PrivacySetting } from "@prisma/client";
import { GameRecord } from "~/server/utils/anonymizeGame";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const script_id = +handler.context.params!.id;

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
      script_id,
      parent_game_id: null,
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
    returnGames.push(await anonymizeGame(game as GameRecord, null));
  }

  return returnGames;
});
