import {
  CacheType,
  CommandInteraction,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import {
  buildEmbed,
  findEvent,
  findEvents,
} from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("delete-event")
  .setDescription(
    (process.env.NODE_ENV !== "production" ? "[DEV] " : "") +
      "Delete an event by its ID"
  )
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("The ID of the event")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction) {
  const guild_id = interaction.guildId;
  const focusedValue = interaction.options.getFocused().toLowerCase();

  await interaction.respond(await findEvents(guild_id, focusedValue));
}

export async function execute(interaction: CommandInteraction<CacheType>) {
  const discord_user_id = interaction.user.id;

  const clocktracker_user = await prisma.userSettings.findFirst({
    where: {
      discord_id: discord_user_id,
      community_admin: {
        some: {
          discord_server_id: interaction.guild.id,
        },
      },
    },
  });

  if (!clocktracker_user) {
    return interaction.reply({
      content: "Only a ClockTracker community admin can create events.",
      ephemeral: true,
    });
  }

  const event_id = interaction.options.get("id").value as string;
  const guild_id = interaction.guildId;

  const event = await findEvent(guild_id, event_id);

  if (!event) {
    return interaction.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  const confirmButton = new ButtonBuilder()
    .setCustomId("delete")
    .setLabel("Delete")
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
    .addComponents(confirmButton)
    .addComponents(cancelButton);

  const { embed } = await buildEmbed(guild_id, event_id);

  await interaction.reply({
    content: `Are you sure you want to delete the event "${event.title}"?`,
    embeds: [embed],
    // @ts-ignore
    components: [row],
    ephemeral: true,
  });
}

export async function handleButton(interaction) {
  if (interaction.customId === "cancel") {
    return interaction.update({
      content: "Event deletion cancelled.",
      embeds: [],
      components: [],
    });
  }

  const event_id = interaction.message.embeds[0].footer.text;

  const event = await prisma.event.findFirst({
    where: {
      id: event_id,
    },
    select: {
      title: true,
    },
  });

  const discord_posts = await prisma.eventDiscordPost.findMany({
    where: {
      event_id: event_id,
    },
  });

  for (const post of discord_posts) {
    const channel = await interaction.client.channels.fetch(post.channel_id);
    const messages = await channel.messages.fetch({
      limit: 2,
      around: post.message_id,
    });

    for (const message of messages) {
      if (message[1].embeds[0]?.footer?.text === event_id) {
        await message[1].delete();
      }
    }
  }

  await prisma.event.delete({
    where: {
      id: event_id,
    },
  });

  await interaction.update({
    content: `Successfully deleted event "${event.title}"`,
    embeds: [],
    components: [],
  });
}
