import type { CommunityPost, Event } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { useFeatureFlags } from "~/server/utils/featureFlags";
import {
  getForumNameColors,
  getForumBadges,
  forumUserSelect,
} from "~/server/utils/forum";

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
        };
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
    }
  | {
      kind: "forum_post";
      date: Date;
      forumPost: {
        id: string;
        body: string;
        created_at: Date;
        edited_at: Date | null;
        author: {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
          name_color: string | null;
          badge: string | null;
        };
        reactions: { emoji: string; user_id: string }[];
        thread: {
          id: string;
          title: string;
          is_locked: boolean;
          category: {
            slug: string;
            name: string;
          };
        };
      };
    };

const PAGE_SIZE = 20;

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const query = getQuery(handler);
  const cursorParam = query.cursor as string | undefined;
  const cursor = cursorParam ? new Date(cursorParam) : undefined;

  // Each sub-query fetches PAGE_SIZE items so we have enough to fill a page
  // after merging and sorting across all sources.
  const dateFilter = cursor ? { lt: cursor } : undefined;

  const recentEvents = await prisma.event.findMany({
    where: {
      OR: [
        {
          community: {
            members: {
              some: {
                user_id: user.id,
              },
            },
          },
        },
        {
          created_by_id: user.id,
        },
        {
          created_by: {
            friends: {
              some: {
                user_id: user.id,
              },
            }
          }
        }
      ],
      who_can_register: {
        in: ["ANYONE", "COMMUNITY_MEMBERS"],
      },
      ...(dateFilter && { created_at: dateFilter }),
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
    take: PAGE_SIZE,
  });

  const recentPosts = await prisma.communityPost.findMany({
    where: {
      deleted: false,
      reply_to_id: null,
      ...(dateFilter && { created_at: dateFilter }),
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
    take: PAGE_SIZE,
  });

  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      ...(dateFilter && { created_at: dateFilter }),
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
    take: PAGE_SIZE,
  });

  const taggedGames = await prisma.game.findMany({
    where: {
      user_id: user.id,
      ...(dateFilter && { created_at: dateFilter }),
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
    orderBy: {
      created_at: "desc",
    },
    take: PAGE_SIZE,
  });

  // Forum posts from subscribed threads (gated by feature flag)
  const featureFlags = await useFeatureFlags(user);
  const recentForumPosts = featureFlags.isEnabled("forum")
    ? await prisma.forumPost.findMany({
        where: {
          deleted_at: null,
          author_id: { not: user.id },
          ...(dateFilter && { created_at: dateFilter }),
          thread: {
            deleted_at: null,
            subscriptions: {
              some: { user_id: user.id },
            },
          },
        },
        select: {
          id: true,
          body: true,
          created_at: true,
          edited_at: true,
          author: {
            select: forumUserSelect,
          },
          reactions: {
            select: { emoji: true, user_id: true },
          },
          thread: {
            select: {
              id: true,
              title: true,
              is_locked: true,
              category: {
                select: { slug: true, name: true },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: PAGE_SIZE,
      })
    : [];

  // Enrich forum post authors with name_color and badge
  const forumAuthorIds = recentForumPosts.map((p) => p.author.user_id);
  const [nameColors, badges] = forumAuthorIds.length
    ? await Promise.all([
        getForumNameColors(forumAuthorIds),
        getForumBadges(forumAuthorIds),
      ])
    : [{}, {}];

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

  for (const post of recentForumPosts) {
    updates.push({
      kind: "forum_post",
      date: post.created_at,
      forumPost: {
        ...post,
        author: {
          ...post.author,
          name_color: nameColors[post.author.user_id] ?? null,
          badge: badges[post.author.user_id] ?? null,
        },
      },
    });
  }

  const sorted = updates.toSorted((a, b) => b.date.getTime() - a.date.getTime());
  const page = sorted.slice(0, PAGE_SIZE);
  const nextCursor = page.length === PAGE_SIZE ? page[page.length - 1].date.toISOString() : null;

  return {
    updates: page,
    nextCursor,
  };
});
