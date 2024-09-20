import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { addUserKofiLevel } from "~/server/utils/addUserKofiLevel";

const prisma = new PrismaClient();

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

  const user = await prisma.userSettings.findUnique({
    where: {
      username,
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
    },
    select: {
      user_id: true,
      username: true,
      display_name: true,
      avatar: true,
      pronouns: true,
      bio: true,
      location: true,
      privacy: true,
      charts: true,
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
    user.privacy === PrivacySetting.PRIVATE ||
    user.privacy === PrivacySetting.FRIENDS_ONLY
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
