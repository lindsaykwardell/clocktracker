import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { PrismaClient, UserSettings } from "@prisma/client";
import { SupabaseClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = new SupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const data = new SlashCommandBuilder()
  .setName("get-event")
  .setDescription("Get an event by its ID")
  .addStringOption((option) =>
    option.setName("id").setDescription("The ID of the event").setRequired(true)
  );

export async function execute(interaction: CommandInteraction<CacheType>) {
  const event_id = interaction.options.get("id").value as string;
  console.log(event_id);

  const event = await findEvent(event_id);

  if (!event) {
    return interaction.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  const { embed, row } = await buildEmbed(event_id);

  const response = await interaction.reply({
    embeds: [embed],
    // @ts-ignore
    components: [row],
  });

  setInterval(async () => {
    const updated = await buildEmbed(event_id);

    response.edit({
      embeds: [updated.embed],
      // @ts-ignore
      components: [updated.row],
    });
  }, 1000 * 60 * 5);

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (i) => {
    const user: UserSettings | null = await getClocktrackerUser(i.user);
    const selection = i.customId;

    const name = user.display_name || i.user.username;
    const user_id = user?.user_id;

    if (selection === "register") {
      if (user_id) {
        const registered = await prisma.eventAttendee.findFirst({
          where: {
            event_id: event.id,
            user_id: user_id,
          },
        });

        await prisma.eventWaitlistAttendee.deleteMany({
          where: {
            waitlist: {
              event_id: event.id,
            },
            user_id: user_id,
          },
        });

        if (registered) {
          await prisma.eventAttendee.deleteMany({
            where: {
              event_id: event.id,
              user_id: user_id,
            },
          });
        } else {
          await prisma.eventAttendee.create({
            data: {
              event_id: event.id,
              user_id: user_id,
              name,
            },
          });
        }
      } else {
        await i.reply({
          content: "You must link your Clocktracker account to register",
          ephemeral: true,
        });
      }
    }

    if (event.waitlists) {
      for (const waitlist of event.waitlists) {
        if (+selection === waitlist.id) {
          const waitlisted = await prisma.eventWaitlistAttendee.findFirst({
            where: {
              waitlist_id: waitlist.id,
              user_id: user_id,
            },
          });

          await prisma.eventAttendee.deleteMany({
            where: {
              event_id: event.id,
              user_id: user_id,
            },
          });

          await prisma.eventWaitlistAttendee.deleteMany({
            where: {
              waitlist: {
                event_id: event.id,
              },
              waitlist_id: {
                not: waitlist.id,
              },
              user_id: user_id,
            },
          });

          if (waitlisted) {
            await prisma.eventWaitlistAttendee.deleteMany({
              where: {
                waitlist_id: waitlist.id,
                user_id: user_id,
              },
            });
          } else {
            await prisma.eventWaitlistAttendee.create({
              data: {
                waitlist_id: waitlist.id,
                user_id: user_id,
                name,
              },
            });
          }
        }
      }
    }

    const updated = await buildEmbed(event_id);

    i.update({
      embeds: [updated.embed],
      // @ts-ignore
      components: [updated.row],
    });
  });
}

async function getClocktrackerUser(user: User): Promise<UserSettings | null> {
  const clocktrackerUser = await prisma.userSettings.findUnique({
    where: {
      discord_id: user.id,
    },
  });

  return clocktrackerUser;
}

async function buildEmbed(event_id: string) {
  const event = await findEvent(event_id);
  if (!event) {
    throw new Error("No event found with that ID");
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(event.title)
    .setURL(
      `https://clocktracker.app/community/${event.community.slug}/event/${event.id}`
    )
    .setAuthor({
      name: event.community.name,
      iconURL: `https://clocktracker.app${event.community.icon}`,
      url: `https://clocktracker.app/community/${event.community.slug}`,
    })
    // .setThumbnail(`https://clocktracker.app${event.community.icon}`)
    .setTimestamp(event.start);

  if (event.image) {
    embed.setImage(event.image);
  }

  if (event.description) {
    embed.setDescription(event.description);
  }

  const fields = [
    {
      name:
        `Players (${
          event.player_count &&
          event.registered_players.length > event.player_count
            ? event.player_count
            : event.registered_players.length
        }` +
        (event.player_count ? `/${event.player_count}` : "") +
        ")",
      value: event.registered_players.map((p) => p.name).join("\n") || "None",
      inline: true,
    },
  ];

  if (
    event.player_count &&
    event.registered_players.length > event.player_count
  ) {
    fields.push({
      name: `Waitlist (${
        event.registered_players.length - event.player_count
      })`,
      value:
        event.registered_players
          .slice(event.player_count)
          .map((p) => p.name)
          .join("\n") || "None",
      inline: true,
    });
  }

  if (event.waitlists) {
    for (const waitlist of event.waitlists) {
      fields.push({
        name: `${waitlist.name} (${waitlist.users.length})`,
        value: waitlist.users.map((u) => u.name).join("\n") || "None",
        inline: true,
      });
    }
  }

  embed.addFields(fields);

  const registerButton = new ButtonBuilder()
    .setCustomId("register")
    .setLabel("Register")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(registerButton);

  for (const waitlist of event.waitlists) {
    const waitlistButton = new ButtonBuilder()
      .setCustomId(`${waitlist.id}`)
      .setLabel(`${waitlist.name}`)
      .setStyle(ButtonStyle.Secondary);

    row.addComponents(waitlistButton);
  }

  return { embed, row };
}

function findEvent(event_id: string) {
  return prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        // slug,
        // banned_users: {
        //   none: {
        //     user_id: me?.id || "",
        //   },
        // },
        OR: [
          {
            is_private: false,
          },
          // {
          //   members: {
          //     some: {
          //       user_id: me?.id || "",
          //     },
          //   },
          //   is_private: true,
          // },
        ],
      },
    },
    include: {
      registered_players: {
        select: {
          name: true,
          created_at: true,
          user: {
            select: {
              user_id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      waitlists: {
        select: {
          id: true,
          name: true,
          default: true,
          created_at: true,
          users: {
            select: {
              name: true,
              created_at: true,
              user: {
                select: {
                  user_id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      community: {
        select: {
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
  });
}
