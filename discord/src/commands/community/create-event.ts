import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { createEventAndReply } from "../../utility/community-event";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("create-event")
  .setDescription("Create a ClockTracker event")
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
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const choices = Intl.supportedValuesOf("timeZone");
  const filtered = choices
    .filter((choice) => choice.toLowerCase().includes(focusedValue))
    .slice(0, 25);

  await interaction.respond(
    filtered.map((choice) => ({ name: choice, value: choice }))
  );
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

  await createEventAndReply(interaction);
}
