import { PrismaClient, WhoCanRegister } from "@prisma/client";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";

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
          const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(event.title)
            .setURL(
              `https://clocktracker.app/community/${
                event.community!.slug
              }/event/${event.id}`
            )
            .setAuthor({
              name: event.community!.name,
              iconURL: `https://clocktracker.app${event.community!.icon}`,
              url: `https://clocktracker.app/community/${
                event.community!.slug
              }`,
            })
            // .setThumbnail(`https://clocktracker.app${event.community.icon}`)
            .setTimestamp(event.start)
            .setFooter({ text: event.id })
            .setDescription(
              `<t:${event.start.getTime() / 1000}:f>\n\n${
                event.description ?? ""
              }`
            );

          if (event.image) {
            embed.setImage(event.image);
          }

          const fields = [
            {
              name:
                `Players (${
                  event.player_count &&
                  event.registered_players.length > event.player_count
                    ? event.player_count
                    : event.registered_players.length
                }` +
                (event.player_count ? `/${event.player_count}` : "") +
                ")",
              value:
                event.registered_players.map((p) => p.name).join("\n") ||
                "None",
              inline: true,
            },
          ];

          if (
            event.player_count &&
            event.registered_players.length > event.player_count
          ) {
            fields.push({
              name: `Waitlist (${
                event.registered_players.length - event.player_count
              })`,
              value:
                event.registered_players
                  .slice(event.player_count)
                  .map((p) => p.name)
                  .join("\n") || "None",
              inline: true,
            });
          }

          if (event.waitlists) {
            for (const waitlist of event.waitlists) {
              fields.push({
                name: `${waitlist.name} (${waitlist.users.length})`,
                value: waitlist.users.map((u) => u.name).join("\n") || "None",
                inline: true,
              });
            }
          }

          embed.addFields(fields);

          const registerButton = new ButtonBuilder()
            .setCustomId("register")
            .setLabel("Register")
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder().addComponents(registerButton);

          for (const waitlist of event.waitlists) {
            const waitlistButton = new ButtonBuilder()
              .setCustomId(`${waitlist.id}`)
              .setLabel(`${waitlist.name}`)
              .setStyle(ButtonStyle.Secondary);

            row.addComponents(waitlistButton);
          }

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
