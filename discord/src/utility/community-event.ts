import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  EmbedBuilder,
  User,
} from "discord.js";
import { LocationType, PrismaClient, UserSettings } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

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
}

export async function handleRegisterButtonClick(i) {
  const guild_id = i.guildId;

  const user: UserSettings | null = await getClocktrackerUser(i.user);
  const selection = i.customId;

  const event_id: string = i.message.embeds[0].footer.text;
  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
    },
    include: {
      waitlists: {
        include: {
          users: true,
        },
      },
    },
  });

  if (!event) {
    return i.reply({
      content: "No event found with that ID",
      ephemeral: true,
    });
  }

  // ClockTracker username OR server nickname OR Discord display name
  const name = user?.display_name || i.member.nickname || i.user.globalName;
  const user_id = user?.user_id;
  const discord_user_id = i.user.id;

  if (selection === "register") {
    const registered = await prisma.eventAttendee.findFirst({
      where: {
        event_id: event.id,
        OR: [
          {
            user_id,
          },
          {
            discord_user_id,
          },
        ],
      },
    });

    await prisma.eventWaitlistAttendee.deleteMany({
      where: {
        waitlist: {
          event_id: event.id,
        },
        OR: [
          {
            user_id,
          },
          {
            discord_user_id,
          },
        ],
      },
    });

    if (registered) {
      await prisma.eventAttendee.deleteMany({
        where: {
          event_id: event.id,
          OR: [
            {
              user_id,
            },
            {
              discord_user_id,
            },
          ],
        },
      });
    } else {
      await prisma.eventAttendee.create({
        data: {
          event_id: event.id,
          user_id: user_id,
          discord_user_id,
          name,
        },
      });
    }
  }

  if (event.waitlists) {
    for (const waitlist of event.waitlists) {
      if (+selection === waitlist.id) {
        const waitlisted = await prisma.eventWaitlistAttendee.findFirst({
          where: {
            waitlist_id: waitlist.id,
            OR: [
              {
                user_id,
              },
              {
                discord_user_id,
              },
            ],
          },
        });

        await prisma.eventAttendee.deleteMany({
          where: {
            event_id: event.id,
            OR: [
              {
                user_id,
              },
              {
                discord_user_id,
              },
            ],
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
            OR: [
              {
                user_id,
              },
              {
                discord_user_id,
              },
            ],
          },
        });

        if (waitlisted) {
          await prisma.eventWaitlistAttendee.deleteMany({
            where: {
              waitlist_id: waitlist.id,
              OR: [
                {
                  user_id,
                },
                {
                  discord_user_id,
                },
              ],
            },
          });
        } else {
          await prisma.eventWaitlistAttendee.create({
            data: {
              waitlist_id: waitlist.id,
              user_id,
              discord_user_id,
              name,
            },
          });
        }
      }
    }
  }

  const updated = await buildEmbed(guild_id, event_id);

  i.update({
    embeds: [updated.embed],
    // @ts-ignore
    components: [updated.row],
  });
}

export async function getClocktrackerUser(
  user: User
): Promise<UserSettings | null> {
  const clocktrackerUser = await prisma.userSettings.findUnique({
    where: {
      discord_id: user.id,
    },
  });

  return clocktrackerUser;
}

export async function buildEmbed(guild_id: string, event_id: string) {
  const event = await findEvent(guild_id, event_id);
  if (!event) {
    throw new Error("No event found with that ID");
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(event.title)
    .setURL(
      `${
        process.env.NODE_ENV === "production"
          ? "https://clocktracker.app"
          : "http://localhost:3000"
      }/community/${event.community.slug}/event/${event.id}`
    )
    .setAuthor({
      name: event.community.name,
      iconURL: `https://clocktracker.app${event.community.icon}`,
      url: `${
        process.env.NODE_ENV === "production"
          ? "https://clocktracker.app"
          : "http://localhost:3000"
      }/community/${event.community.slug}`,
    })
    // .setThumbnail(`https://clocktracker.app${event.community.icon}`)
    .setTimestamp(event.start)
    .setFooter({ text: event.id })
    .setDescription(
      `<t:${Math.round(event.start.getTime() / 1000)}:f>\n\n${
        event.description ?? ""
      }`
    );

  if (event.image) {
    embed.setImage(event.image);
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
      value:
        (event.player_count
          ? event.registered_players.slice(0, event.player_count)
          : event.registered_players
        )
          .map((p) => p.name)
          .join("\n") || "None",
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

export function findEvent(guild_id: string, event_id: string) {
  return prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        discord_server_id: guild_id,
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

export function formatInputs(interaction, allowBlankDates = false) {
  const id = interaction.options.get("id")?.value as string;
  const name = interaction.options.get("name")?.value as string;
  const description = interaction.options.get("description")?.value as string;
  const start_date_input = interaction.options.get("start_date")
    ?.value as string;
  const end_date_input = interaction.options.get("end_date")?.value as string;
  const timezone = interaction.options.get("timezone")?.value as string;
  const location = interaction.options.get("location")?.value as string;
  const location_type_input = interaction.options.get("location_type")
    ?.value as string;
  const player_count = interaction.options.get("player_count")?.value as number;
  const image = interaction.options.get("image")?.value as string;
  const waitlist_1 = interaction.options.get("waitlist_1")?.value as string;
  const waitlist_2 = interaction.options.get("waitlist_2")?.value as string;
  const waitlist_3 = interaction.options.get("waitlist_3")?.value as string;
  const waitlist_4 = interaction.options.get("waitlist_4")?.value as string;
  const waitlist_5 = interaction.options.get("waitlist_5")?.value as string;
  const delete_waitlist_1 = interaction.options.get("delete_waitlist_1")
    ?.value as string;
  const delete_waitlist_2 = interaction.options.get("delete_waitlist_2")
    ?.value as string;
  const delete_waitlist_3 = interaction.options.get("delete_waitlist_3")
    ?.value as string;
  const delete_waitlist_4 = interaction.options.get("delete_waitlist_4")
    ?.value as string;
  const delete_waitlist_5 = interaction.options.get("delete_waitlist_5")
    ?.value as string;
  const guild_id = interaction.guildId;

  const location_type = (() => {
    if (location_type_input === "IN_PERSON") {
      return LocationType.IN_PERSON;
    } else {
      return LocationType.ONLINE;
    }
  })();

  const waitlists = [];
  const removedWaitlists = [];

  if (waitlist_1) {
    waitlists.push({
      name: waitlist_1,
    });
  }

  if (waitlist_2) {
    waitlists.push({
      name: waitlist_2,
    });
  }

  if (waitlist_3) {
    waitlists.push({
      name: waitlist_3,
    });
  }

  if (waitlist_4) {
    waitlists.push({
      name: waitlist_4,
    });
  }

  if (waitlist_5) {
    waitlists.push({
      name: waitlist_5,
    });
  }

  if (delete_waitlist_1) {
    removedWaitlists.push(delete_waitlist_1);
  }

  if (delete_waitlist_2) {
    removedWaitlists.push(delete_waitlist_2);
  }

  if (delete_waitlist_3) {
    removedWaitlists.push(delete_waitlist_3);
  }

  if (delete_waitlist_4) {
    removedWaitlists.push(delete_waitlist_4);
  }

  if (delete_waitlist_5) {
    removedWaitlists.push(delete_waitlist_5);
  }

  const start_date = (() => {
    if (start_date_input) {
      return dayjs(start_date_input)
        .tz(timezone || "America/New_York")
        .toDate();
    } else if (!allowBlankDates) {
      return dayjs()
        .tz(timezone || "America/New_York")
        .add(1, "hour")
        .toDate();
    } else {
      return null;
    }
  })();

  const end_date = (() => {
    if (end_date_input) {
      return dayjs(end_date_input)
        .tz(timezone || "America/New_York")
        .toDate();
    } else if (!allowBlankDates) {
      return dayjs(start_date).add(1.5, "hour").toDate();
    } else {
      return null;
    }
  })();

  return {
    id,
    name,
    description,
    start_date,
    end_date,
    location,
    location_type,
    player_count,
    image,
    waitlists,
    removedWaitlists,
    guild_id,
  };
}
