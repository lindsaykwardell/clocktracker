import { PrivacySetting } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import type { GameRecord } from "~/server/utils/anonymizeGame";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params?.slug as string;

  const community = await prisma.community.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      is_private: true,
      members: {
        select: {
          user_id: true,
        },
      },
      banned_users: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!community) {
    console.error(`Community not found: ${slug}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (
    community.banned_users.some((banned_user) => banned_user.user_id === me?.id)
  ) {
    console.error(
      `User ${me?.id} is banned from community ${slug} (${community.id})`
    );
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  // If the community is private, only members can see the games
  // But it's not an error.
  const isMember = community.members.some(
    (member) => member.user_id === me?.id
  );

  if (community.is_private && !isMember) {
    return [];
  }

  const games = await prisma.game.findMany({
    take: 200,
    where: {
      deleted: false,
      community_id: community.id,
      ...(isMember ? {} : { privacy: PrivacySetting.PUBLIC }),
      parent_game_id: null,
    },
    include: {
      ls_game: {
        select: {
          campaign: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      },
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
              alternate_token_urls: true,
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
        select: {
          id: true,
          role_id: true,
          game_id: true,
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
        },
      },
      fabled: {
        select: {
          id: true,
          role_id: true,
          game_id: true,
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            select: {
              id: true,
              role_id: true,
              related_role_id: true,
              alignment: true,
              is_dead: true,
              used_ghost_vote: true,
              order: true,
              grimoire_id: true,
              player_name: true,
              player_id: true,
              created_at: true,
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
              player: {
                select: {
                  display_name: true,
                  username: true,
                  avatar: true,
                },
              },
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
      child_games: {
        select: {
          id: true,
          user_id: true,
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
          background: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  const anonymizedGames: GameRecord[] = [];

  for (const game of games) {
    anonymizedGames.push(
      await anonymizeGame(
        game as GameRecord,
        me,
        false // always default to anonymous when loading on a community page
      )
    );
  }

  return anonymizedGames;
});
