import { PrismaClient, WhoCanRegister } from "@prisma/client";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";
import { generateEmbed } from "~/discord/src/utility/community-event";

const prisma = new PrismaClient();

export async function fetchEventAndUpdateDiscord(event_id: string) {
  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
    },
    select: {
      id: true,
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
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const discord_posts = await prisma.eventDiscordPost.findMany({
    where: {
      event_id: event_id,
    },
    select: {
      channel_id: true,
      message_id: true,
    },
  });

  // If the event has a Discord post, update it.
  if (discord_posts.length) {
    const client = new Client({
      intents: GatewayIntentBits.GuildMessages,
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);

    discord_posts.forEach(async (post) => {
      const channel = await client.channels.fetch(post.channel_id);
      if (!channel) return;
      // @ts-ignore
      const messages = await channel.messages.fetch({
        limit: 2,
        around: post.message_id,
      });

      for (const message of messages) {
        if (message[1].embeds[0]?.footer?.text === event.id) {
          const { embed, row } = generateEmbed(event as any);

          await message[1].edit({
            embeds: [embed],
            components: [row],
          });
        }
      }
    });
  }

  return event;
}
