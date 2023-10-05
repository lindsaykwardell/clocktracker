import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import naturalOrder from "natural-order";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    return [];
  }

  // Get all friends of the user's friends
  // 1. Get all friends of the user
  // 2. Get all friends of the user's friends
  // 3. Filter out the user's friends and the user
  // 4. Order recommendations based on frequency

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
        )
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
    .sort(["frequency", "display_name"]).splice(0, 6);
});
