import { PrismaClient, PrivacySetting } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const { query } = getQuery(handler) as { query: string };

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
      banned_users: {
        none: {
          user_id: me?.id || "",
        },
      },
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
  });

  const scripts = await prisma.script.findMany({
    where: {
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
  });

  const users = await prisma.userSettings.findMany({
    where: {
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
        {
          OR: [
            {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              display_name: {
                contains: query,
                mode: "insensitive",
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
  });

  const roles = await prisma.role.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
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
  });

  return {
    communities,
    users,
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
