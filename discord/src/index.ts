// use dotenv to load environment variables
import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { PrismaClient } from "@prisma/client";
import { exportEmbed } from "./eventEmbed";

const prisma = new PrismaClient();

const main = async () => {
  const commands = [
    {
      name: "ping",
      description: "Replies with Pong!",
    },
    {
      name: "user-count",
      description: "Replies with the number of users in the server",
    },
    {
      name: "next-event",
      description: "Replies with the next event for this server",
    },
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("error", console.error);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }

    if (interaction.commandName === "user-count") {
      const users = await prisma.userSettings.count();
      await interaction.reply(`There are ${users} users in the server!`);
    }

    if (interaction.commandName === "next-event") {
      const community = await prisma.community.findFirst({
        where: {
          discord_server_id: interaction.guildId,
        },
      });

      if (!community) {
        await interaction.reply("There is no community for this server!");
        return;
      }

      const event = await prisma.event.findFirst({
        where: {
          community_id: community.id,
          start: {
            gt: new Date(),
          },
        },
        include: {
          EventAttendee: true,
        },
        orderBy: {
          start: "asc",
        },
      });

      if (!event) {
        await interaction.reply("There are no upcoming events!");
        return;
      }

      // const message = await interaction.reply(
      //   `The next event is ${event.title} on ${event.start}. https://clocktracker.app/community/${community.slug}/event/${event.id}`
      // );

      const embed = exportEmbed(event, community);
      const message = await interaction.channel.send({ embeds: [embed] });

      // Add emoji reactions to the message
      await message.react("👍");
      // await message.react("👎");
      await message.react("👎");
    }
  });

  client.login(process.env.TOKEN);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
