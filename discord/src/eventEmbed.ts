import { EmbedBuilder } from "discord.js";
import { Event, Community, EventAttendee } from "@prisma/client";

export function eventEmbed(
  event: Event & { EventAttendee: EventAttendee[] },
  community: Community
) {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(event.title)
    .setURL(
      `https://clocktracker.app/community/${community.slug}/event/${event.id}`
    )
    // .setAuthor({
    //   name: "Some name",
    //   iconURL: "https://i.imgur.com/AfFp7pu.png",
    //   url: "https://discord.js.org",
    // })
    .setThumbnail(`https://clocktracker.app${community.icon}`)
    // .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp(event.start);

  if (event.description) {
    embed.setDescription(event.description);
  }

  if (event.player_count) {
    embed.addFields(
      {
        name: `Players (${
          event.EventAttendee.length > event.player_count
            ? event.player_count
            : event.EventAttendee.length
        }/${event.player_count})`,
        value: event.EventAttendee.map((p) => p.name).join("\n") || "None",
        inline: true,
      },
      {
        name: "Waitlist",
        value:
          event.EventAttendee.slice(event.player_count)
            .map((p) => p.name)
            .join("\n") || "None",
        inline: true,
      }
    );
  }

  return embed;
}
