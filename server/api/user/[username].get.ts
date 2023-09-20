import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params?.username as string;

  const isMe = me ?
    (
      await prisma.userSettings.findUnique({
        where: {
          user_id: me?.id || "",
        },
        select: {
          username: true,
        },
      })
    )?.username === username : false;

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
          friends: {
            some: {
              user_id: me?.id || "",
            },
          },
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
