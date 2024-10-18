import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { addUserKofiLevel } from "../utils/addUserKofiLevel";
import geolib from "geolib";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const params = getQuery(handler) as {
    query: string;
    near_me?: string;
    lat?: number;
    lon?: number;
  };

  const query = params.query.trim();
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (params.near_me) {
    if (params.lat && params.lon) {
      latitude = params.lat;
      longitude = params.lon;
    } else if (me) {
      const { city_id } = await prisma.userSettings
        .findUnique({
          where: {
            user_id: me.id,
          },
          select: {
            city_id: true,
          },
        })
        .then((res) => res || { city_id: null });

      if (!city_id) {
        throw createError({
          status: 400,
          statusMessage: "Bad Request",
        });
      }

      const city = await prisma.city.findFirst({
        where: {
          users: {
            some: {
              user_id: me.id,
            },
          },
          id: city_id,
        },
      });

      if (!city) {
        throw createError({
          status: 400,
          statusMessage: "Bad Request",
        });
      }

      latitude = city.latitude;
      longitude = city.longitude;
    }
  }

  // Don't query if it's too small or if we don't have location data
  if (query.length < 3 && !(latitude && longitude)) {
    return {
      users: [],
      communities: [],
      scripts: [],
      roles: [],
    };
  }

  const bounds =
    latitude && longitude
      ? geolib.getBoundsOfDistance(
          {
            latitude: latitude,
            longitude: longitude,
          },
          40_233.6 // 25 miles in meters
        )
      : null;

  const communities = await prisma.community.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
      city:
        latitude && longitude
          ? {
              OR: [
                {
                  latitude: {
                    gte: bounds?.[0].latitude,
                    lte: bounds?.[1].latitude,
                  },
                  longitude: {
                    gte: bounds?.[0].longitude,
                    lte: bounds?.[1].longitude,
                  },
                },
                {
                  latitude: {
                    gte: bounds?.[1].latitude,
                    lte: bounds?.[0].latitude,
                  },
                  longitude: {
                    gte: bounds?.[1].longitude,
                    lte: bounds?.[0].longitude,
                  },
                },
              ],
            }
          : undefined,
      banned_users: {
        none: {
          user_id: me?.id || "",
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      is_private: true,
      location: true,
      time_zone: true,
      city_id: true,
      city: true,
      _count: {
        select: {
          members: true,
          admins: true,
          posts: {
            where: {
              deleted: false,
            },
          },
        },
      },
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        slug: "asc",
      },
      {
        location: "asc",
      },
      {
        description: "asc",
      },
    ],
  });

  const scripts =
    query.length > 3
      ? await prisma.script.findMany({
          where: {
            AND: {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  author: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            },
            OR: [
              {
                is_custom_script: false,
              },
              {
                is_custom_script: true,
                user_id: me?.id,
              },
            ],
          },
          include: {
            _count: {
              select: {
                games: {
                  where: {
                    parent_game_id: null,
                  },
                },
              },
            },
          },
          orderBy: [
            {
              name: "asc",
            },
            {
              author: "asc",
            },
          ],
        })
      : [];

  const users =
    query.length > 3
      ? await prisma.userSettings.findMany({
          where: {
            OR: [
              {
                display_name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
            AND: [
              {
                OR: [
                  {
                    privacy: PrivacySetting.PUBLIC,
                  },
                  {
                    privacy: PrivacySetting.PRIVATE,
                  },
                  {
                    privacy: PrivacySetting.FRIENDS_ONLY,
                    friends: {
                      some: {
                        friend_id: me?.id || "",
                      },
                    },
                  },
                ],
              },
            ],
          },
          select: {
            user_id: true,
            username: true,
            display_name: true,
            avatar: true,
            pronouns: true,
            bio: true,
            location: true,
            charts: true,
          },
          orderBy: [
            {
              display_name: "asc",
            },
            {
              username: "asc",
            },
          ],
        })
      : [];

  const usersWithKofiLevel = await Promise.all(users.map(addUserKofiLevel));

  const roles =
    query.length > 3
      ? await prisma.role.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
            OR: [
              {
                custom_role: false,
              },
              {
                custom_role: true,
                scripts: {
                  some: {
                    user_id: me?.id,
                  },
                },
              },
            ],
          },
          // We need to count the number of games a given role appears in
          // Roles are included in games via Character, which has a many to one relationship with Game
          // We can't use _count here because it doesn't support nested includes
          include: {
            _count: {
              select: {
                scripts: true,
              },
            },
            character: {
              select: {
                game: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: [
            {
              name: "asc",
            },
          ],
        })
      : [];

  const sortedCommunities = (() => {
    if (latitude && longitude) {
      const orderedLocations = geolib.orderByDistance(
        { latitude, longitude },
        communities
          .map((c) => c.city!)
          .filter(
            (c, i, arr) =>
              arr.findIndex(
                (a) => a.latitude === c.latitude && a.longitude === c.longitude
              ) === i
          )
      ) as { latitude: number; longitude: number }[];

      // Sort the communities list to match the orderedLocations
      return orderedLocations.flatMap((location) =>
        communities.filter(
          (c, i, arr) =>
            c.city?.latitude === location.latitude &&
            c.city?.longitude === location.longitude
        )
      );
    } else {
      return communities;
    }
  })();

  return {
    communities: sortedCommunities,
    users: usersWithKofiLevel,
    scripts: scripts.reduce((acc, script) => {
      if (!acc.some((s) => s.script_id === script.script_id)) {
        acc.push(script);
      }

      return acc;
    }, [] as typeof scripts),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      initial_alignment: role.initial_alignment,
      type: role.type,
      token_url: role.token_url,
      _count: {
        scripts: role._count.scripts,
        games: role.character.reduce((acc, character) => {
          if (character?.game && !acc.includes(character.game.id)) {
            acc.push(character.game.id);
          }

          return acc;
        }, [] as string[]).length,
      },
    })),
  };
});
