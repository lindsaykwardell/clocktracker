import { defineCronHandler } from "#nuxt/cron";
import { performLockedTask } from "../utils/cronLock";
import { sendPushNotifications } from "../utils/sendPushNotifications";

export default defineCronHandler(
  "everyFiveMinutes",
  async () =>
    performLockedTask("event_reminders", async (prisma) => {
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const twentyFiveMinutesFromNow = new Date(now.getTime() + 25 * 60 * 1000);

      // Find events starting in ~30 minutes (within a 5-minute window to avoid duplicates)
      const upcomingEvents = await prisma.event.findMany({
        where: {
          start: {
            gte: twentyFiveMinutesFromNow,
            lte: thirtyMinutesFromNow,
          },
        },
        select: {
          id: true,
          title: true,
          short_link: true,
          registered_players: {
            select: { user_id: true },
          },
        },
      });

      for (const event of upcomingEvents) {
        const userIds = event.registered_players
          .map((p) => p.user_id)
          .filter((id): id is string => !!id);

        if (userIds.length === 0) continue;

        const eventUrl = event.short_link
          ? `/event/${event.short_link}`
          : `/event/${event.id}`;

        await sendPushNotifications({
          userIds,
          title: "Event starting soon",
          body: `${event.title} starts in 30 minutes`,
          url: eventUrl,
        });
      }
    }),
  {
    runOnInit: false,
  }
);
