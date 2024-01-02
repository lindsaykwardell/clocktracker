// use dotenv to load environment variables
import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes, Events } from "discord.js";
import { PrismaClient } from "@prisma/client";
import { eventEmbed } from "./eventEmbed";
import { SupabaseClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = new SupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

  client.on(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on(Events.Error, console.error);

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }

    if (interaction.commandName === "user-count") {
      const users = await prisma.userSettings.count();
      await interaction.reply(`There are ${users} users in the server!`);
    }

    if (interaction.commandName === "next-event") {
      // Find the user in the Supabase database where the discord ID matches the user ID
      const supabaseUser = await supabase
        .from("users")
        .select("*")
        .eq("discord_id", interaction.user.id)
        .single();

      console.log(supabaseUser);

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

      const embed = eventEmbed(event, community);
      const message = await interaction.channel.send({ embeds: [embed] });

      // Add emoji reactions to the message
      await message.react("👍");
      // await message.react("👎");
      await message.react("👎");
    }
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Something went wrong when fetching the message:", error);
        // Return as `reaction.message.author` may be undefined/null
        return;
      }
    }

    // Now the message has been cached and is fully available
    console.log(
      `${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`
    );
    // The reaction is now also fully available and the properties will be reflected accurately:
    console.log(
      `${reaction.count} user(s) have given the same reaction to this message!`
    );
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
