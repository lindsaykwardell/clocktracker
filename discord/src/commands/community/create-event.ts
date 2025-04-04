import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  buildEmbed,
  formatInputs,
  handleRegisterButtonClick,
} from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";
import naturalOrder from "natural-order/dist/natural-order.umd";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("create-event")
  .setDescription(
    (process.env.NODE_ENV !== "production" ? "[DEV] " : "") +
      "Create a ClockTracker event"
  )
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the event")
      .setRequired(true)
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

  if (focusedValue.name === "timezone") {
    const choices = Intl.supportedValuesOf("timeZone");
    const filtered = choices
      .filter((choice) => choice.toLowerCase().includes(focusedValue.value))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
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
    waitlists,
    guild_id,
  } = formatInputs(interaction);

  const community = await prisma.community.findFirst({
    where: {
      discord_server_id: guild_id,
    },
  });

  const event = await prisma.event.create({
    data: {
      community_id: community.id,
      title: name,
      description: description || "",
      start: start_date,
      end: end_date,
      location: location || "",
      location_type: location_type,
      player_count: player_count || null,
      game_link: game_link || "",
      storytellers: storytellers || [],
      script_id: script ? script.id : null,
      script: script ? script.name : "",
      image,
      waitlists: {
        createMany: {
          data: waitlists,
        },
      },
      created_by_id: clocktracker_user.user_id,
    },
  });

  const { embed, row } = await buildEmbed(guild_id, event.id);

  const response = await interaction.reply({
    embeds: [embed],
    // @ts-ignore
    components: [row],
  });

  await prisma.eventDiscordPost.create({
    data: {
      event_id: event.id,
      channel_id: interaction.channel.id,
      message_id: response.id,
    },
  });
}

export const handleButton = handleRegisterButtonClick;
