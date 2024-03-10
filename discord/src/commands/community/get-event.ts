import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { replyWithEvent, findEvent } from "../../utility/community-event";

export const data = new SlashCommandBuilder()
  .setName("get-event")
  .setDescription("Get an event by its ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("The ID of the event").setRequired(true)
  );

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

  await replyWithEvent(interaction);
}
