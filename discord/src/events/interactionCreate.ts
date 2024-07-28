import { Events } from "discord.js";

export const name = Events.InteractionCreate;
export async function execute(interaction) {
  // If the bot is in development mode, only allow commands in the development guild
  if (
    process.env.NODE_ENV !== "production" &&
    interaction.guildId !== process.env.DEV_GUILD_ID
  ) {
    return;
  } // If the bot is in production mode, only allow commands from guilds that aren't development
  else if (
    process.env.NODE_ENV === "production" &&
    interaction.guildId === process.env.DEV_GUILD_ID
  ) {
    return;
  }
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  } else if (interaction.isButton()) {
    const command = interaction.client.commands.get(
      interaction.message.interaction.commandName
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.handleButton(interaction);
    } catch (error) {
      console.error(error);
    }
  }
}
