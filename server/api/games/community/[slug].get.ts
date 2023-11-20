import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { GameRecord } from "~/server/utils/anonymizeGame";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params?.slug as string;

  const community = await prisma.community.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!community) {
    console.error(`Community not found: ${slug}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  console.log(`Fetching games for community ${slug} (${community.id})`);

  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      community_id: community.id,
      privacy: PrivacySetting.PUBLIC,
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
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
      },
      parent_game: {
        select: {
          user: {
            select: {
              username: true,
              display_name: true,
            },
          },
        },
      },
    },
  });

  const anonymizedGames: GameRecord[] = [];

  for (const game of games) {
    anonymizedGames.push(await anonymizeGame(game as GameRecord, me));
  }

  return anonymizedGames;
});
