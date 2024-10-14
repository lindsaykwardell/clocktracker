import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { addUserKofiLevel } from "../utils/addUserKofiLevel";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const params = getQuery(handler) as { query: string };

  const query = params.query.trim();

  // Don't query if it's too small
  if (query.length < 3) {
    return {
      users: [],
      communities: [],
      scripts: [],
    };
  }

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
      ],
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
    orderBy: {
      _relevance: {
        fields: ["name", "slug", "description"],
        search: query,
        sort: "asc",
      },
    },
  });

  const scripts = await prisma.script.findMany({
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
    orderBy: {
      _relevance: {
        fields: ["author", "name"],
        search: query,
        sort: "asc",
      },
    },
  });

  const users = await prisma.userSettings.findMany({
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
    orderBy: {
      _relevance: {
        fields: ["display_name", "username"],
        search: query,
        sort: "asc",
      },
    },
  });

  const usersWithKofiLevel = await Promise.all(users.map(addUserKofiLevel));

  const roles = await prisma.role.findMany({
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
    orderBy: {
      _relevance: {
        fields: ["name"],
        search: query,
        sort: "asc",
      },
    },
  });

  return {
    communities,
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
