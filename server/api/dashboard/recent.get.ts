import { CommunityPost, Event, PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

type Update =
  | {
      kind: "new_event";
      date: Date;
      event: {
        id: string;
        community_id: number | null;
        title: string;
        description: string;
        start: Date;
        end: Date;
        location: string;
        location_type: "ONLINE" | "IN_PERSON";
        player_count: number | null;
        image: string | null;
        who_can_register: "ANYONE" | "PRIVATE" | "COMMUNITY_MEMBERS";
        storytellers: string[];
        script: string;
        script_id: number | null;
        game_link: string | null;
        registered_players: {
          name: string;
          created_at: Date;
          discord_user_id: string | null;
          user: {
            user_id: string;
            username: string;
            avatar: string | null;
          } | null;
        }[];
        waitlists: {
          id: number;
          name: string;
          default: boolean;
          users: {
            name: string;
            created_at: Date;
            discord_user_id: string | null;
            user: {
              user_id: string;
              username: string;
              avatar: string | null;
            } | null;
          }[];
        }[];
        community: {
          id: number;
          name: string;
          slug: string;
          icon: string;
        } | null;
        created_by: {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
        } | null;
      };
    }
  | {
      kind: "new_post";
      date: Date;
      post: {
        id: string;
        content: string;
        created_at: Date;
        user: {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
        };
        replies: {
          id: string;
          content: string;
          created_at: Date;
          user: {
            user_id: string;
            username: string;
            display_name: string;
            avatar: string | null;
          };
        }[];
        _count: {
          replies: number;
        };
        community: {
          id: number;
          name: string;
          slug: string;
          icon: string;
        }
      };
    }
  | {
      kind: "friend_request";
      date: Date;
      request: {
        id: number;
        accepted: boolean;
        user_id: string;
        from_user_id: string;
        from_user: {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
        };
        user: {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
        };
      };
    }
  | {
      kind: "tagged_game";
      date: Date;
      game: {
        id: string;
        parent_game: {
          user: {
            username: string;
            display_name: string;
            avatar: string | null;
          } | null;
        } | null;
      };
    };

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  /**
   * We need to find all the recent stuff that has happened.
   * This is a computed property that will return the events
   *
   * Things we need to fetch:
   * - Newly scheduled events
   * - New community posts
   * - New friend requests?
   * - Recently tagged games?
   */

  const recentEvents = await prisma.event.findMany({
    where: {
      community: {
        members: {
          some: {
            user_id: user.id,
          },
        },
      },
    },
    select: {
      created_at: true,
      id: true,
      community_id: true,
      title: true,
      description: true,
      start: true,
      end: true,
      location: true,
      location_type: true,
      player_count: true,
      image: true,
      who_can_register: true,
      storytellers: true,
      script: true,
      script_id: true,
      game_link: true,
      registered_players: {
        select: {
          name: true,
          discord_user_id: true,
          created_at: true,
          user: {
            select: {
              user_id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      waitlists: {
        select: {
          id: true,
          name: true,
          default: true,
          created_at: true,
          users: {
            select: {
              name: true,
              created_at: true,
              discord_user_id: true,
              user: {
                select: {
                  user_id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
      created_by: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 20,
  });

  const recentPosts = await prisma.communityPost.findMany({
    where: {
      deleted: false,
      reply_to_id: null,
      community: {
        members: {
          some: {
            user_id: user.id,
          },
        },
      },
    },
    select: {
      id: true,
      content: true,
      created_at: true,
      user: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
      replies: {
        select: {
          id: true,
          content: true,
          created_at: true,
          user: {
            select: {
              user_id: true,
              username: true,
              display_name: true,
              avatar: true,
            },
          },
        },
        where: {
          deleted: false,
        },
        orderBy: {
          created_at: "asc",
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              deleted: false,
            },
          },
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 20,
  });

  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          from_user_id: user.id,
        },
        {
          user_id: user.id,
        },
      ],
    },
    include: {
      from_user: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
      user: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const taggedGames = await prisma.game.findMany({
    where: {
      user_id: user.id,
      parent_game_id: {
        not: null,
      },
    },
    select: {
      id: true,
      created_at: true,
      parent_game: {
        select: {
          user: {
            select: {
              username: true,
              display_name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  const updates: Update[] = [];

  for (const event of recentEvents) {
    updates.push({
      kind: "new_event",
      date: event.created_at,
      event,
    });
  }

  for (const post of recentPosts) {
    updates.push({
      kind: "new_post",
      date: post.created_at,
      post,
    });
  }

  for (const request of friendRequests) {
    updates.push({
      kind: "friend_request",
      date: request.created_at || new Date(),
      request,
    });
  }

  for (const game of taggedGames) {
    updates.push({
      kind: "tagged_game",
      date: game.created_at || new Date(),
      game,
    });
  }

  return updates
    .toSorted((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);
});
