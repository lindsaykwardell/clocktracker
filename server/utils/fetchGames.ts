import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { PrivacySetting } from "~/server/generated/prisma/client";
import { anonymizeGame, type GameRecord } from "~/server/utils/anonymizeGame";
import { prisma } from "./prisma";
import { hasPermission } from "./permissions";

export async function fetchGames(user_id: string, me: User | null) {
  const canViewPrivate = me ? await hasPermission(me.id, "VIEW_PRIVATE_GAMES") : false;

  const privacyFilter = canViewPrivate
    ? {}
    : {
        OR: [
          // PUBLIC PROFILE
          // PUBLIC GAME
          {
            user: {
              privacy: PrivacySetting.PUBLIC,
            },
            privacy: PrivacySetting.PUBLIC,
          },
          // PRIVATE GAME
          {
            user: {
              privacy: PrivacySetting.PUBLIC,
              OR: [
                { user_id: me?.id || "" },
                { friends: { some: { user_id: me?.id || "" } } },
              ],
            },
            privacy: PrivacySetting.PRIVATE,
          },
          // FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.PUBLIC,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          // PRIVATE PROFILE
          // PUBLIC GAME
          {
            user: { privacy: PrivacySetting.PRIVATE },
            privacy: PrivacySetting.PUBLIC,
          },
          // PRIVATE GAME
          {
            user: {
              privacy: PrivacySetting.PRIVATE,
              OR: [
                { user_id: me?.id || "" },
                { friends: { some: { user_id: me?.id || "" } } },
              ],
            },
            privacy: PrivacySetting.PRIVATE,
          },
          // FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.PRIVATE,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          // FRIENDS ONLY PROFILE
          // PUBLIC GAME
          {
            user: {
              privacy: PrivacySetting.FRIENDS_ONLY,
              OR: [
                { user_id: me?.id || "" },
                { friends: { some: { user_id: me?.id || "" } } },
              ],
            },
            privacy: PrivacySetting.PUBLIC,
          },
          // PRIVATE GAME
          {
            user: {
              privacy: PrivacySetting.FRIENDS_ONLY,
              OR: [
                { user_id: me?.id || "" },
                { friends: { some: { user_id: me?.id || "" } } },
              ],
            },
            privacy: PrivacySetting.PRIVATE,
          },
          // FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.FRIENDS_ONLY,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
        ],
      };

  const [games, isFriend] = await Promise.all([prisma.game.findMany({
    where: {
      deleted: false,
      user_id,
      ...privacyFilter,
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
      grimoire_events: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          by_role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
        },
      },
      end_trigger_role: {
        select: {
          id: true,
          token_url: true,
          type: true,
          initial_alignment: true,
          name: true,
        },
      },
      grimoire: {
        include: {
          tokens: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              role_id: true,
              related_role_id: true,
              alignment: true,
              is_dead: true,
              used_ghost_vote: true,
              order: true,
              grimoire_id: true,
              grimoire_participant_id: true,
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
        orderBy: {
          id: "asc",
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
  }),
  // Run friend check in parallel with games query
  prisma.friend.findFirst({
    where: {
      OR: [
        {
          user_id: user_id,
          friend_id: me?.id || "",
        },
        {
          user_id: me?.id || "",
          friend_id: user_id,
        },
      ],
    },
  }).then((r) => !!r),
  ]);

  const anonymizedGames: GameRecord[] = [];

  for (const game of games) {
    anonymizedGames.push(await anonymizeGame(game as GameRecord, me, isFriend || canViewPrivate));
  }

  return anonymizedGames;
}

export async function fetchGame(
  id: string,
  me: User | null,
  my_game: boolean = false
) {
  const canViewPrivate = me ? await hasPermission(me.id, "VIEW_PRIVATE_GAMES") : false;

  const privacyFilter = canViewPrivate
    ? {}
    : {
        OR: [
          // PUBLIC PROFILE, PUBLIC GAME
          {
            user: { privacy: PrivacySetting.PUBLIC },
            privacy: PrivacySetting.PUBLIC,
          },
          // PUBLIC PROFILE, PRIVATE GAME (direct links allowed)
          {
            user: { privacy: PrivacySetting.PUBLIC },
            privacy: PrivacySetting.PRIVATE,
          },
          // PUBLIC PROFILE, FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.PUBLIC,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          // PRIVATE PROFILE, PUBLIC GAME
          {
            user: { privacy: PrivacySetting.PRIVATE },
            privacy: PrivacySetting.PUBLIC,
          },
          // PRIVATE PROFILE, PRIVATE GAME (direct links allowed)
          {
            user: { privacy: PrivacySetting.PRIVATE },
            privacy: PrivacySetting.PRIVATE,
          },
          // PRIVATE PROFILE, FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.PRIVATE,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          // FRIENDS ONLY PROFILE, PUBLIC GAME
          {
            user: { privacy: PrivacySetting.FRIENDS_ONLY },
            privacy: PrivacySetting.PUBLIC,
          },
          // FRIENDS ONLY PROFILE, PRIVATE GAME (direct links allowed)
          {
            user: { privacy: PrivacySetting.FRIENDS_ONLY },
            privacy: PrivacySetting.PRIVATE,
          },
          // FRIENDS ONLY PROFILE, FRIENDS ONLY GAME
          {
            user: {
              privacy: PrivacySetting.FRIENDS_ONLY,
              OR: [
                { friends: { some: { user_id: me?.id || "" } } },
                { user_id: me?.id || "" },
              ],
            },
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
        ],
      };

  const game = await prisma.game.findUnique({
    where: {
      id,
      user_id: my_game ? me?.id || "" : undefined,
      deleted: false,
      ...privacyFilter,
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
              type: true,
            },
          },
        },
      },
      grimoire_events: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          by_role: {
            select: {
              id: true,
              name: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
        },
      },
      end_trigger_role: {
        select: {
          id: true,
          token_url: true,
          type: true,
          initial_alignment: true,
          name: true,
        },
      },
      grimoire: {
        include: {
          tokens: {
            orderBy: {
              order: "asc",
            },
            include: {
              role: true,
              related_role: true,
              reminders: true,
              player: {
                select: {
                  username: true,
                  display_name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      child_games: {
        select: {
          id: true,
          user_id: true,
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
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const isFriend = !!(await prisma.friend.findFirst({
    where: {
      OR: [
        {
          user_id: game.user_id,
          friend_id: me?.id || "",
        },
        {
          user_id: me?.id || "",
          friend_id: game.user_id,
        },
      ],
    },
  }));

  return anonymizeGame(game as GameRecord, me, isFriend || canViewPrivate);
}
