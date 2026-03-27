import { PrivacySetting } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { addUserKofiLevel } from "~/server/utils/addUserKofiLevel";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

  if (username === "anonymous") {
    // Return an anonymous user

    const randomName = generateName();
    return {
      username: "anonymous",
      display_name: randomName.display_name,
      avatar: "/img/default.png",
      pronouns: "they/them",
      bio: "This user is anonymous.",
      location: "Unknown",
      privacy: PrivacySetting.PUBLIC,
      charts: [],
      role_stat_cards: [],
    };
  }

  const isMe = me
    ? (
        await prisma.userSettings.findUnique({
          where: {
            user_id: me?.id || "",
          },
          select: {
            username: true,
          },
        })
      )?.username === username
    : false;

  if (isMe) {
    sendRedirect(handler, "/api/settings");
  }

  const canViewPrivate = me ? await hasPermission(me.id, "VIEW_PRIVATE_USERS") : false;

  const privacyFilter = canViewPrivate
    ? {}
    : {
        OR: [
          {
            privacy: PrivacySetting.PUBLIC,
          },
          {
            privacy: PrivacySetting.PRIVATE,
          },
          {
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
                sent_friend_requests: {
                  some: {
                    user_id: me?.id || "",
                    from_user: {
                      username,
                    },
                    accepted: false,
                  },
                },
              },
              {
                friend_requests: {
                  some: {
                    from_user_id: me?.id || "",
                    user: {
                      username,
                    },
                    accepted: false,
                  },
                },
              },
              {
                communities: {
                  some: {
                    AND: [
                      {
                        members: {
                          some: { user_id: me?.id || "" },
                        },
                      },
                      {
                        members: {
                          some: { username },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          {
            privacy: PrivacySetting.PERSONAL,
            user_id: me?.id || "",
          },
        ],
      };

  const user = await prisma.userSettings.findUnique({
    where: {
      username,
      ...privacyFilter,
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      pronouns: true,
      bio: true,
      location: true,
      city_id: true,
      privacy: true,
      charts: true,
      role_stat_cards: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              ability: true,
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
        },
        orderBy: [
          {
            created_at: "asc",
          },
        ],
      },
      communities: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
      },
      favorites: {
        select: {
          game_id: true,
        },
      },
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (
    !canViewPrivate &&
    (user.privacy === PrivacySetting.PRIVATE ||
      user.privacy === PrivacySetting.FRIENDS_ONLY)
  ) {
    // Check if the user is friends with the user
    const isFriend = await prisma.friend.findFirst({
      where: {
        user_id: me?.id || "",
        friend_id: user.user_id,
      },
    });

    if (!isFriend) {
      user.communities = [];
    }
  }

  return addUserKofiLevel(user);
});
