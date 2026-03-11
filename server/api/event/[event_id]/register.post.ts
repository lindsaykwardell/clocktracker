import { WhoCanRegister } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";
import { prisma } from "~/server/utils/prisma";
import { hasRestriction } from "~/server/utils/permissions";

// In-memory rate limit cache with TTL-based eviction
const rateLimitCache = new Map<string, { last: string; requests: number }>();
const RATE_LIMIT_TTL_MS = 60 * 60 * 1000; // 1 hour
let lastCleanup = Date.now();

function cleanupRateLimitCache() {
  const now = Date.now();
  // Only run cleanup at most once per 5 minutes
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;

  for (const [key, value] of rateLimitCache) {
    if (now - new Date(value.last).getTime() > RATE_LIMIT_TTL_MS) {
      rateLimitCache.delete(key);
    }
  }
}

export default defineEventHandler(async (handler) => {
  const ip_address = getRequestIP(handler, { xForwardedFor: true });
  const event_id = handler.context.params!.event_id;
  const me: User | null = handler.context.user;
  const body = await readBody<{
    name: string;
    waitlist_id?: number;
  } | null>(handler);

  // If the IP is banned, throw a 403.
  if (ip_address) {
    const banned = await prisma.eventRegistrationSpam.findFirst({
      where: {
        ip_address,
        is_banned: true,
      },
    });

    if (banned) {
      throw createError({
        status: 403,
        statusMessage: "Forbidden",
      });
    }
  }

  // Only implement spam protection if the user is not logged in.
  // This is _specifically_ for the case where a user is not logged in and is spamming the registration
  // endpoint.
  if (ip_address && !me) {
    cleanupRateLimitCache();

    const registered_at = rateLimitCache.get(ip_address);

    if (registered_at) {
      const registered_at_date = new Date(registered_at.last);
      const now = new Date();

      const diff = now.getTime() - registered_at_date.getTime();
      const diffMinutes = Math.floor(diff / 60000);

      const required_cooldown =
        5 * (registered_at.requests <= 5 ? 1 : registered_at.requests - 5);

      // If the user has registered too many times in the last n minutes, throw a 429.
      // The number of minutes is based on the number of requests made, with a minimum of 5 minutes.
      // For example, if the user has made 6 requests, they must wait 30 minutes before trying again.
      if (diffMinutes < required_cooldown && registered_at.requests >= 5) {
        // Reject the user
        // Log who they are

        const existing_record = await prisma.eventRegistrationSpam.findUnique(
          {
            where: {
              ip_address_event_id: {
                event_id,
                ip_address,
              },
            },
          }
        );

        if (!existing_record) {
          await prisma.eventRegistrationSpam.create({
            data: {
              ip_address,
              event_id,
              name: body?.name || "",
            },
          });
        }

        throw createError({
          status: 429,
          statusMessage:
            "You have attempted to register too many times. Please wait a few minutes and try again.",
        });
      }
      // If the user has registered more than 5 times, but it's been more than 5 times the number
      // of requests since the last registration times 2, reset the count.
      else if (diffMinutes >= required_cooldown * 2) {
        rateLimitCache.set(ip_address, {
          last: new Date().toISOString(),
          requests: 1,
        });
      } else {
        rateLimitCache.set(ip_address, {
          last: registered_at.last,
          requests: registered_at.requests + 1,
        });
      }
    } else {
      rateLimitCache.set(ip_address, {
        last: new Date().toISOString(),
        requests: 1,
      });
    }
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  if (me && await hasRestriction(me.id, "REGISTER_FOR_EVENT")) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
      OR: [
        {
          community: {
            members: {
              some: {
                user_id: me?.id || "",
              },
            },
          },
          who_can_register: WhoCanRegister.COMMUNITY_MEMBERS,
        },
        {
          created_by_id: me?.id,
        },
        {
          created_by: {
            friends: {
              some: {
                user_id: me?.id || "",
              },
            },
          },
          who_can_register: WhoCanRegister.COMMUNITY_MEMBERS,
        },
        {
          who_can_register: WhoCanRegister.ANYONE,
        },
        {
          who_can_register: WhoCanRegister.PRIVATE,
        },
      ],
    },
    select: {
      id: true,
      player_count: true,
      registered_players: {
        select: {
          id: true,
        },
      },
      waitlists: {
        select: {
          id: true,
          default: true,
        },
      },
      discord_posts: true,
      community: true,
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Was a waitlist ID provided?
  if (body.waitlist_id) {
    // Verify that it exists and is associated with the event.
    const waitlist = await prisma.eventWaitlist.findFirst({
      where: {
        id: body.waitlist_id,
        event_id,
      },
    });

    // If it doesn't exist, throw a 400
    if (!waitlist) {
      throw createError({
        status: 400,
        statusMessage: "Bad Request",
      });
    }

    // If it does exist, add the user to the waitlist.
    await prisma.eventWaitlistAttendee.create({
      data: {
        waitlist_id: body.waitlist_id,
        user_id: me?.id || null,
        name: body.name,
        ip_address,
      },
    });
  } else if (!event.player_count) {
    // Is there a player count? If not, add the user to the list of registered players.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
        ip_address,
      },
    });
  } else if (event.registered_players.length < event.player_count) {
    // Are there already enough players? If not, add the user to the list of registered players.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
        ip_address,
      },
    });
  } else if (event.waitlists.find((w) => w.default)) {
    // Is there a default waitlist? If so, add the user to the default waitlist.
    await prisma.eventWaitlistAttendee.create({
      data: {
        waitlist_id: event.waitlists.find((w) => w.default)!.id,
        user_id: me?.id || null,
        name: body.name,
        ip_address,
      },
    });
  } else {
    // There is no default waitlist. Add the user to the registered players list.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
        ip_address,
      },
    });
  }

  return fetchEventAndUpdateDiscord(event_id);
});
