import { PrismaClient, Event } from "@prisma/client";
import { Client } from "discord.js";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const KILL_DATE = new Date("2026-03-01T08:00:00.000Z");

export const schedule = "0 * * * * *";
export async function execute(client: Client) {
  // Killswitch: stop cron after March 1st, 2026 midnight Pacific
  if (new Date() >= KILL_DATE) return;
  // Find all events starting in 15 minutes
  const events = await prisma.event.findMany({
    where: {
      has_pinged_discord: false,
      start: {
        gte: new Date(),
        lt: dayjs().add(15, "minute").toDate(),
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

  for (const event of events) {
    // Send a message to all registered players with discord IDs
    for (const player of event.registered_players) {
      if (player.discord_user_id) {
        const user = await client.users.fetch(player.discord_user_id);

        sendMessage(user, event);
      }
    }

    // Send a message to all waitlisted players with discord IDs
    for (const waitlist of event.waitlists) {
      for (const player of waitlist.users) {
        if (player.discord_user_id) {
          const user = await client.users.fetch(player.discord_user_id);

          sendMessage(user, event);
        }
      }
    }

    // Update the event to show that it has been pinged
    await prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        has_pinged_discord: true,
      },
    });
  }
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
