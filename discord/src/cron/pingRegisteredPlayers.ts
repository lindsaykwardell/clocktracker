import { PrismaClient, Event } from "@prisma/client";
import { Client } from "discord.js";

const prisma = new PrismaClient();

export const schedule = "0 * * * * *";
export async function execute(client: Client) {
  // Find all events starting in 15 minutes
  const events = await prisma.event.findMany({
    where: {
      has_pinged_discord: false,
      start: {
        gte: new Date(),
        lt: new Date(Date.now() + 15 * 60 * 1000),
      },
    },
    select: {
      id: true,
      title: true,
      game_link: true,
      community: {
        select: {
          name: true,
        },
      },
      registered_players: {
        select: {
          discord_user_id: true,
        },
      },
      waitlists: {
        select: {
          users: {
            select: {
              discord_user_id: true,
            },
          },
        },
      },
    },
  });

  // Send a message to all registered players with discord IDs
  events.forEach((event) => {
    event.registered_players.forEach((player) => {
      client.users.fetch(player.discord_user_id).then((user) => {
        sendMessage(user, event);
      });
    });

    // Send a message to all waitlisted players with discord IDs
    event.waitlists.forEach((waitlist) => {
      waitlist.users.forEach((player) => {
        client.users.fetch(player.discord_user_id).then((user) => {
          sendMessage(user, event);
        });
      });
    });

    prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        has_pinged_discord: true,
      },
    });
  });
}

function sendMessage(user, event) {
  user.send(
    `Event "${event.title}" on ${
      event.community.name
    } is starting soon! Get ready!${
      event.game_link ? ` Join here: ${event.game_link}` : ""
    }`
  );
}
