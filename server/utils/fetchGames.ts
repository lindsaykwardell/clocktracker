import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";
import { anonymizeGame, GameRecord } from "~/server/utils/anonymizeGame";

const prisma = new PrismaClient();

export async function fetchGames(
  user_id: string,
  me: User | null,
  waiting_for_confirmation: boolean = false
) {
  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      user_id,
      waiting_for_confirmation,
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
        // This is an indirect lookup for a given user, so we need
        // to make sure that the user can see the games.
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // PRIVATE PROFILE
        // PUBLIC GAME
        // No filtering done here, because the game is public.
        // We'll need to anonymize the user's profile, though.
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // This is an indirect lookup for a given user, so we need
        // to make sure that the user can see the games.
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // FRIENDS ONLY PROFILE
        // PUBLIC GAME
        // We're just treating this as a friends only game, because
        // we don't want to show the user's profile.
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
      ],
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
      // demon_bluffs: {
      //   include: {
      //     role: {
      //       select: {
      //         token_url: true,
      //         type: true,
      //       },
      //     },
      //   },
      // },
      // fabled: {
      //   include: {
      //     role: {
      //       select: {
      //         token_url: true,
      //       },
      //     },
      //   },
      // },
      // grimoire: {
      //   include: {
      //     tokens: {
      //       include: {
      //         role: true,
      //         related_role: true,
      //         reminders: true,
      //       },
      //     },
      //   },
      // },
      // parent_game: {
      //   select: {
      //     user: {
      //       select: {
      //         username: true,
      //         display_name: true,
      //       },
      //     },
      //   },
      // },
      // community: {
      //   select: {
      //     slug: true,
      //     icon: true,
      //   },
      // },
      associated_script: {
        select: {
          version: true,
          script_id: true,
          is_custom_script: true,
          logo: true,
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

  // We need to know if the user is a friend of the game creator
  const isFriend = !!(await prisma.friend.findFirst({
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
  }));

  for (const game of games) {
    anonymizedGames.push(
      await anonymizeGame(
        {
          ...game,
          grimoire: [],
          demon_bluffs: [],
          fabled: [],
        } as GameRecord,
        me,
        isFriend
      )
    );
  }

  return anonymizedGames;
}

export async function fetchGame(
  id: string,
  me: User | null,
  my_game: boolean = false
) {
  const game = await prisma.game.findUnique({
    where: {
      id,
      user_id: my_game ? me?.id || "" : undefined,
      deleted: false,
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
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PUBLIC,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // PRIVATE PROFILE
        // PUBLIC GAME
        // No filtering done here, because the game is public.
        // We'll need to anonymize the user's profile, though.
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
        // FRIENDS ONLY PROFILE
        // PUBLIC GAME
        // No filtering done here, because the game is public.
        // We'll need to anonymize the user's profile, though.
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          privacy: PrivacySetting.PUBLIC,
        },
        // PRIVATE GAME
        // Direct links are allowed, so we aren't performing any checks on the user
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
          },
          privacy: PrivacySetting.PRIVATE,
        },
        // FRIENDS ONLY GAME
        {
          user: {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          privacy: PrivacySetting.FRIENDS_ONLY,
        },
      ],
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

  return anonymizeGame(game as GameRecord, me, isFriend);
}
