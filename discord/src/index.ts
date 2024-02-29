// use dotenv to load environment variables
import "dotenv/config";
import {
  CacheType,
  Client,
  Collection,
  CommandInteraction,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import fs from "fs";
import path from "path";

type Command = {
  data: { name: string; [key: string]: any };
  execute: (interaction: CommandInteraction<CacheType>) => Promise<void>;
};

const main = async () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as Client<boolean> & {
    commands: Collection<string, Command>;
  };

  client.commands = new Collection();

  const commands = [];
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command: Command = await import(filePath);
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(process.env.TOKEN);

  // and deploy your commands!
  (async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      if (process.env.NODE_ENV === "production") {
        const data = await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands }
        );

        console.log(
          // @ts-ignore
          `Successfully reloaded ${data.length} application (/) commands.`
        );
      } else {
        const data = await rest.put(
          Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.DEV_GUILD_ID
          ),
          { body: commands }
        );

        console.log(
          // @ts-ignore
          `Successfully reloaded ${data.length} application (/) commands.`
        );
      }
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

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
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.login(process.env.TOKEN);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {});
