import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("get-event")
  .setDescription("Get an event by its ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("The ID of the event").setRequired(true)
  );

export async function execute(interaction: CommandInteraction<CacheType>) {
  const event_id = interaction.options.get("id").value as string;
  console.log(event_id);

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        // slug,
        // banned_users: {
        //   none: {
        //     user_id: me?.id || "",
        //   },
        // },
        OR: [
          {
            is_private: false,
          },
          // {
          //   members: {
          //     some: {
          //       user_id: me?.id || "",
          //     },
          //   },
          //   is_private: true,
          // },
        ],
      },
    },
    include: {
      registered_players: {
        select: {
          name: true,
          created_at: true,
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
              name: true,
              created_at: true,
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
    return interaction.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(event.title)
    .setURL(
      `https://clocktracker.app/community/${event.community.slug}/event/${event.id}`
    )
    .setAuthor({
      name: event.community.name,
      iconURL: `https://clocktracker.app${event.community.icon}`,
      url: `https://clocktracker.app/community/${event.community.slug}`,
    })
    // .setThumbnail(`https://clocktracker.app${event.community.icon}`)
    .setTimestamp(event.start);

  if (event.image) {
    embed.setImage(event.image);
  }

  if (event.description) {
    embed.setDescription(event.description);
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
      value: event.registered_players.map((p) => p.name).join("\n") || "None",
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

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (i) => {
    const selection = i.customId;
    await i.reply(`${i.user} has selected ${selection}!`);
  });
}
