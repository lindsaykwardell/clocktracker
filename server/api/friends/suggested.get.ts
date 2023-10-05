import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import naturalOrder from "natural-order";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          from_user_id: user.id,
        },
        {
          user_id: user.id,
        },
      ],
      accepted: false,
    },
    include: {
      from_user: {
        select: {
          user_id: true,
          username: true,
        },
      },
      user: {
        select: {
          user_id: true,
          username: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const requestIds = requests.flatMap((request) => [
    request.user_id,
    request.from_user_id,
  ]);

  const friendsWithFriends = await prisma.friend.findMany({
    where: {
      user_id: user.id,
    },
    select: {
      friend: {
        select: {
          user_id: true,
          friend_of: {
            select: {
              friend: {
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
              },
            },
          },
        },
      },
    },
  });

  const friendsOfFriends = friendsWithFriends
    .flatMap((friend) => friend.friend.friend_of.map((friend) => friend.friend))
    .filter(
      (f) =>
        f.user_id !== user.id &&
        !friendsWithFriends.find(
          (friend) => friend.friend.user_id === f.user_id
        ) &&
        (f.privacy === PrivacySetting.PUBLIC ||
          f.privacy === PrivacySetting.PRIVATE) &&
        !requestIds.includes(f.user_id)
    );

  const recommendations = friendsOfFriends.reduce((acc, friend) => {
    const existing = acc.find((f) => f.user_id === friend.user_id);

    if (existing) {
      existing.frequency += 1;
    } else {
      acc.push({ ...friend, frequency: 1 });
    }

    return acc;
  }, [] as any[]);

  return naturalOrder(recommendations)
    .orderBy(["desc", "asc"])
    .sort(["frequency", "display_name"])
    .slice(0, 10);
});
