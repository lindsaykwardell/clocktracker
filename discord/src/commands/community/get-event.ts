import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  findEvent,
  buildEmbed,
  handleRegisterButtonClick,
} from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("get-event")
  .setDescription("Get an event by its ID")
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

  const choices = await prisma.event.findMany({
    where: {
      community: {
        discord_server_id: guild_id,
      },
      end: {
        gte: new Date(),
      },
      title: {
        contains: focusedValue,
        mode: "insensitive",
      },
    },
    take: 25,
    orderBy: {
      start: "asc",
    },
    select: {
      id: true,
      title: true,
      start: true,
    },
  });

  await interaction.respond(
    choices.map((choice) => ({
      name: `${choice.title} - ${dayjs(choice.start).format(
        "YYYY-MM-DD HH:mm"
      )}`,
      value: choice.id,
    }))
  );
}

export async function execute(interaction: CommandInteraction<CacheType>) {
  const event_id = interaction.options.get("id").value as string;
  const guild_id = interaction.guildId;

  const event = await findEvent(guild_id, event_id);

  if (!event) {
    return interaction.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  const { embed, row } = await buildEmbed(guild_id, event_id);

  const response = await interaction.reply({
    embeds: [embed],
    // @ts-ignore
    components: [row],
  });

  await prisma.eventDiscordPost.create({
    data: {
      event_id: event_id,
      channel_id: interaction.channel.id,
      message_id: response.id,
    },
  });
}

export const handleButton = handleRegisterButtonClick;
