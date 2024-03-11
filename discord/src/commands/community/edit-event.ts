import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { buildEmbed, formatInputs, handleRegisterButtonClick } from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("edit-event")
  .setDescription("Edit a ClockTracker event")
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("The ID of the event")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("A description of the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("start_date")
      .setDescription("The start date of the event (YYYY-MM-DD HH:MM)")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("end_date")
      .setDescription("The end date of the event (YYYY-MM-DD HH:MM)")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("timezone")
      .setDescription("The timezone of the event")
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName("location")
      .setDescription("The location of the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("location_type")
      .setDescription("The type of location")
      .setRequired(false)
      .addChoices(
        { name: "Online", value: "ONLINE" },
        { name: "In person", value: "IN_PERSON" }
      )
  )
  .addNumberOption((option) =>
    option
      .setName("player_count")
      .setDescription("The number of players allowed in the event")
      .setRequired(false)
      .setMinValue(5)
      .setMaxValue(20)
  )
  .addStringOption((option) =>
    option
      .setName("image")
      .setDescription("A URL to an image for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_1")
      .setDescription("The first custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_2")
      .setDescription("The second custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_3")
      .setDescription("The third custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_4")
      .setDescription("The fourth custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_5")
      .setDescription("The fifth custom waitlist for the event")
      .setRequired(false)
  );

export async function autocomplete(interaction) {
  const focusedValue: { name: string; value: string } =
    interaction.options.getFocused(true);
  let choices: { name: string; value: string }[];

  if (focusedValue.name === "timezone") {
    choices = Intl.supportedValuesOf("timeZone").map((choice) => ({
      name: choice,
      value: choice,
    }));
  } else if (focusedValue.name === "id") {
    const guild_id = interaction.guildId;

    choices = (
      await prisma.event.findMany({
        where: {
          community: {
            discord_server_id: guild_id,
          },
          end: {
            gte: new Date(),
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
      })
    ).map((choice) => ({
      name: `${choice.title} - ${dayjs(choice.start).format(
        "YYYY-MM-DD HH:mm"
      )}`,
      value: choice.id,
    }));
  }

  const filtered = choices
    .filter((choice) => choice.name.toLowerCase().includes(focusedValue.value))
    .slice(0, 25);

  await interaction.respond(filtered);
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

  const {
    id,
    name,
    description,
    start_date,
    end_date,
    location,
    location_type,
    player_count,
    image,
    guild_id,
  } = formatInputs(interaction, true);

  const existing_event = await prisma.event.findUnique({
    where: {
      id,
      community: {
        discord_server_id: guild_id,
      },
    },
    include: {
      waitlists: true,
    },
  });

  if (!existing_event) {
    return interaction.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  const event = await prisma.event.update({
    where: {
      id,
    },
    data: {
      title: name || existing_event.title,
      description: description || existing_event.description,
      start: start_date || existing_event.start,
      end: end_date || existing_event.end,
      location: location || existing_event.location,
      location_type: location_type || existing_event.location_type,
      player_count: player_count || existing_event.player_count,
      image: image || existing_event.image,
      // waitlists: {
      //   delete: existing_event.waitlists.filter((waitlist) =>
      //     waitlists.every((newWaitlist) => newWaitlist !== waitlist.name)
      //   ),
      //   createMany: {
      //     data: waitlists
      //       .filter((waitlist) =>
      //         existing_event.waitlists.every(
      //           (existingWaitlist) => existingWaitlist.name !== waitlist
      //         )
      //       )
      //       .map((waitlist) => ({
      //         name: waitlist,
      //       })),
      //   },
      // },
    },
  });

  const { embed, row } = await buildEmbed(guild_id, event.id);

  const discord_posts = await prisma.eventDiscordPost.findMany({
    where: {
      event_id: event.id,
    },
    select: {
      channel_id: true,
      message_id: true,
    },
  });

  discord_posts.forEach(async (post) => {
    const channel = await interaction.client.channels.fetch(post.channel_id);
    if (!channel) return;

    // @ts-ignore
    const messages = await channel.messages.fetch({
      limit: 2,
      around: post.message_id,
    });

    for (const message of messages) {
      if (message[1].embeds[0]?.footer?.text === event.id) {
        await message[1].edit({
          embeds: [embed],
          components: [row],
        });
      }
    }
  });

  await interaction.reply({
    content: "Event updated!",
    ephemeral: true,
  });
}

export const handleButton = handleRegisterButtonClick;