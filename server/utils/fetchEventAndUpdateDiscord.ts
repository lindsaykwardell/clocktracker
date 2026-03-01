import { prisma } from "./prisma";

export async function fetchEventAndUpdateDiscord(event_id: string) {
  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
    },
    select: {
      id: true,
      community_id: true,
      title: true,
      description: true,
      start: true,
      end: true,
      location: true,
      location_type: true,
      player_count: true,
      storytellers: true,
      script: true,
      script_id: true,
      who_can_register: true,
      image: true,
      game_link: true,
      registered_players: {
        select: {
          id: true,
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
      waitlists: {
        select: {
          id: true,
          name: true,
          default: true,
          created_at: true,
          users: {
            select: {
              id: true,
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
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return event;
}
