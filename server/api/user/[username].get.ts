import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  log: ["query"],
});

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

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
    },
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return user;
});
