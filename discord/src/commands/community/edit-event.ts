import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  buildEmbed,
  findEvents,
  formatInputs,
  handleRegisterButtonClick,
} from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";
import naturalOrder from "natural-order/dist/natural-order.umd";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("edit-event")
  .setDescription(
    (process.env.NODE_ENV !== "production" ? "[DEV] " : "") +
      "Edit a ClockTracker event"
  )
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
      .setName("game_link")
      .setDescription("A link to the game")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("storytellers")
      .setDescription("The storytellers for the event (comma separated)")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("script")
      .setDescription("The script for the event")
      .setRequired(false)
      .setAutocomplete(true)
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
      .setDescription("Add a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_2")
      .setDescription("Add a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_3")
      .setDescription("Add a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_4")
      .setDescription("Add a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("waitlist_5")
      .setDescription("Add a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("delete_waitlist_1")
      .setDescription("Remove a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("delete_waitlist_2")
      .setDescription("Remove a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("delete_waitlist_3")
      .setDescription("Remove a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("delete_waitlist_4")
      .setDescription("Remove a custom waitlist for the event")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("delete_waitlist_5")
      .setDescription("Remove a custom waitlist for the event")
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

    choices = await findEvents(guild_id, focusedValue.value);
  } else if (focusedValue.name === "script") {
    const scripts = await prisma.script.findMany({
      where: {
        name: {
          contains: focusedValue.value,
          mode: "insensitive",
        },
        is_custom_script: false,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        script_id: true,
        name: true,
      },
    });

    const results: {
      id: number;
      script_id: string;
      name: string;
    }[] = [];

    for (const script of naturalOrder(scripts)
      .orderBy("desc")
      .sort(["version", "name"])) {
      if (
        results.length < 10 &&
        !results.some((s) => s.script_id === script.script_id)
      ) {
        results.push({
          id: script.id,
          name: script.name,
          script_id: script.script_id!,
        });
      }
    }

    if (focusedValue.value !== "") {
      results.push({
        id: 0,
        name: `${focusedValue.value} (Use custom script)`,
        script_id: "custom",
      });
    }

    await interaction.respond(
      results.map((script) => ({
        name: script.name,
        value: `${script.name}::${script.id}`,
      }))
    );
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
    game_link,
    storytellers,
    script,
    image,
    guild_id,
    waitlists,
    removedWaitlists,
  } = formatInputs(interaction, true);

  const existing_event = await prisma.event.findUnique({
    where: {
      id,
      community: {
        discord_server_id: guild_id,
      },
    },
    include: {
      waitlists: {
        select: {
          id: true,
          name: true,
        },
      },
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
      game_link: game_link || existing_event.game_link,
      storytellers: storytellers || existing_event.storytellers,
      script_id: script ? script.id : existing_event.script_id,
      script: script ? script.name : existing_event.script,
      image: image || existing_event.image,
      waitlists: {
        delete: existing_event.waitlists.filter((waitlist) =>
          removedWaitlists.includes(waitlist.name)
        ),
        createMany: {
          data: waitlists,
        },
      },
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
