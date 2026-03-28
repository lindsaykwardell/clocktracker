const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient, WinStatus, WinStatus_V2 } = require("../server/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { createClient } = require("@supabase/supabase-js");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const { roles, roleNames, reminders } = require("./roles");
const citySeed = require("./city-seed.json");
const scripts = require("./scripts.json");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const existingRoleIds = roles.map((role) => ({
  id: role.id,
  map_id: role.id,
}));

roles.forEach((role) => {
  if (role.id.includes("_")) {
    existingRoleIds.push({
      id: role.id.replaceAll("_", ""),
      map_id: role.id,
    });
  } else if (role.id.includes("-")) {
    existingRoleIds.push({
      id: role.id.replaceAll("-", ""),
      map_id: role.id,
    });
  }
});

async function main() {
  // Upsert all the roles
  console.log("Upserting roles...");
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        id: role.id,
      },
      update: role,
      create: role,
    });
  }

  const scriptList = [];

  // Assortment of scripts to add to the `scriptList`
  const scriptIds = [76, 65, 77, 491, 133, 441, 427, 42, 135, 134, 1774, 136];

  // Add the random scripts to the `scriptList`
  for (const scriptId of scriptIds) {
    const script = scripts.find(
      (s) => s.script_id.toString() == scriptId.toString()
    );

    const roleIds = script.roles;

    const knownRoles = roleIds
      .map((role) => {
        const existingRoleId = existingRoleIds.find(
          (existingRole) => existingRole.id === role.id
        );

        if (existingRoleId) {
          return { ...role, id: existingRoleId.map_id };
        }
        return role;
      })
      .filter((role) =>
        existingRoleIds.some((existingRole) => existingRole.id === role.id)
      );

    const savedRoles = await prisma.role.findMany({
      where: {
        id: {
          in: knownRoles.map((role) => role.id),
        },
      },
    });

    script.roles = savedRoles;

    scriptList.push(script);
  }

  // Upsert the reminders
  for (const reminder of reminders) {
    await prisma.roleReminder.upsert({
      where: {
        role_id_reminder: {
          role_id: reminder.role_id,
          reminder: reminder.reminder,
        },
      },
      update: reminder,
      create: reminder,
    });
  }

  console.log("Seeding scripts");
  for (const script of scriptList) {
    const savedScript = await prisma.script.create({
      data: {
        script_id: script.script_id,
        name: script.name,
        version: script.version,
        author: script.author,
        type: script.type,
        json_url: script.json_url,
        pdf_url: script.pdf_url,
        roles: {
          connect: script.roles.map((role) => ({ id: role.id })),
        },
      },
    });

    script.id = savedScript.id;
  }

  console.log("Seeding locations");

  await prisma.city.createMany({
    data: citySeed.map((city) => ({
      id: city.properties.osm_id.toString(),
      name: `${city.properties.name}, ${city.properties.state}, ${city.properties.country}`,
      latitude: city.geometry.coordinates[1],
      longitude: city.geometry.coordinates[0],
    })),
  });

  const cities = await prisma.city.findMany();

  const portland = await prisma.city.findFirst({
    where: {
      id: "186579",
    },
  });
  const boring = await prisma.city.findFirst({
    where: {
      id: "5122552325",
    },
  });

  const testUser = await prisma.userSettings.create({
    data: {
      user_id: uuidv4(),
      username: "test",
      finished_welcome: true,
      avatar: "/img/role/160x160/investigator.webp",
      email: "me@me.me",
      display_name: "Test User",
      location: boring.name,
      city_id: boring.id,
      pronouns: "they/them",
      is_admin: false,
      privacy: "PUBLIC",
    },
  });

  const testUser2 = await prisma.userSettings.create({
    data: {
      user_id: uuidv4(),
      username: "test2",
      finished_welcome: true,
      avatar: "/img/role/160x160/empath.webp",
      email: "me2@me.me",
      display_name: "Test User 2",
      location: boring.name,
      city_id: boring.id,
      pronouns: "they/them",
      is_admin: false,
      privacy: "PRIVATE",
    },
  });

  const myUsername = process.env.LOCAL_USERNAME || "ClockTrackerDeveloper";
  const myPassword = process.env.LOCAL_PASSWORD || "password123";
  const email = process.env.LOCAL_EMAIL || "dev@clocktracker.app";
  const localUserId =
    process.env.LOCAL_USER_ID || "00000000-0000-4000-8000-000000000001";
  let resolvedUserId = localUserId;

  // Try to create a local auth account so the printed login details actually work.
  // If this fails (e.g. auth not reachable), we still seed UserSettings with LOCAL_USER_ID.
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: myPassword,
    });

    if (error) {
      console.warn(`[seed] auth signup warning: ${error.message}`);
    } else if (data?.user?.id) {
      resolvedUserId = data.user.id;
    }
  } catch (error) {
    console.warn(
      `[seed] auth signup skipped, continuing with LOCAL_USER_ID (${localUserId})`
    );
  }

  const me = await prisma.userSettings.create({
    data: {
      user_id: resolvedUserId,
      username: myUsername,
      finished_welcome: true,
      avatar:
        "https://fly.storage.tigris.dev/clocktracker-storage/avatars/14a762ee-3909-4e9a-a613-cb27b92c17b8",
      email,
      display_name: myUsername,
      bio: "During a hellish thunderstorm, a scream echoes through the sleepy town of Ravenswood Bluff. The townsfolk rush to investigate and find the beloved local storyteller has been murdered, their body hanging limp from the clocktower. As blood drips onto the cobblestones below, a realisation slowly dawns… a demon has been unleashed, killing by night and taking on human form by day. Can good find the demon in time? Or will evil overrun this once peaceful town?",
      is_admin: true,
      privacy: "FRIENDS_ONLY",
      city_id: portland.id,
      location: portland.name,
    },
  });

  const users = [testUser, testUser2, me];

  for (let i = 0; i < 100; i++) {
    const { username, display_name, randomRole } = generateName();

    // Get a random city
    const city = cities[Math.floor(Math.random() * cities.length)];

    const user = await prisma.userSettings.create({
      data: {
        user_id: uuidv4(),
        username,
        display_name,
        finished_welcome: true,
        avatar: `/img/role/160x160/${randomRole
          .toLowerCase()
          .replace(/ /g, "")
          .replace(/'/g, "")
          .replace(/-/g, "")}.webp`,
        email: faker.internet.email(),
        location: city.name,
        city_id: city.id,
        pronouns: "they/them",
        is_admin: false,
        privacy: "PUBLIC",
      },
    });

    users.push(user);
  }

  console.log("Seeding charts");

  const charts = [
    {
      title: "Win Rate",
      type: "BAR",
      data: "WIN",
      pivot: "ROLE",
      width: 250,
      height: 250,
    },
    {
      title: "Role Types",
      type: "PIE",
      data: "ROLE",
      pivot: null,
      width: 250,
      height: 250,
    },
  ];

  for (const user of users) {
    await prisma.chart.createMany({
      data: charts.map((chart) => ({
        ...chart,
        user_id: user.user_id,
      })),
    });
  }

  console.log("Seeding friends");

  await prisma.friendRequest.createMany({
    data: [
      {
        user_id: testUser.user_id,
        from_user_id: me.user_id,
        accepted: true,
      },
      {
        user_id: testUser2.user_id,
        from_user_id: testUser.user_id,
        accepted: true,
      },
    ],
  });

  await prisma.friend.createMany({
    data: [
      {
        user_id: testUser.user_id,
        friend_id: me.user_id,
      },
      {
        user_id: me.user_id,
        friend_id: testUser.user_id,
      },
      {
        user_id: testUser2.user_id,
        friend_id: testUser.user_id,
      },
      {
        user_id: testUser.user_id,
        friend_id: testUser2.user_id,
      },
    ],
  });

  for (let i = 0; i < 200; i++) {
    let user1;
    let user2;
    const created_at = faker.date.past();

    while (!user1 || !user2 || user1.user_id === user2.user_id) {
      user1 = users[Math.floor(Math.random() * users.length)];
      user2 = users[Math.floor(Math.random() * users.length)];
    }

    const exists = await prisma.friendRequest.findFirst({
      where: {
        user_id: user1.user_id,
        from_user_id: user2.user_id,
      },
    });

    if (exists) {
      continue;
    }

    await prisma.friendRequest.create({
      data: {
        user_id: user1.user_id,
        from_user_id: user2.user_id,
        accepted: true,
        created_at,
      },
    });

    await prisma.friend.createMany({
      data: [
        {
          user_id: user1.user_id,
          friend_id: user2.user_id,
          created_at,
        },
        {
          user_id: user2.user_id,
          friend_id: user1.user_id,
          created_at,
        },
      ],
    });
  }

  console.log("Seeding communities");
  const communities = [];

  async function seedCommunity(
    name,
    description,
    icon,
    isPrivate,
    members,
    links = [],
    city = cities[Math.floor(Math.random() * cities.length)]
  ) {
    const slug = name.toLowerCase().replace(/ /g, "-");
    const userCount = Math.floor(Math.random() * 50) + 5;
    const communityUsers = [...members];
    for (let i = 0; i < userCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];

      if (user && user.user_id) {
        communityUsers.push({
          user_id: user.user_id,
        });
      }
    }

    // create mock posts
    const postCount = Math.floor(Math.random() * 50) + 12;
    const posts = [];
    for (let i = 0; i < postCount; i++) {
      const poster =
        communityUsers[Math.floor(Math.random() * communityUsers.length)];

      if (poster) {
        const repliesCount = Math.floor(Math.random() * 10) + 1;
        const replies = [];
        for (let i = 0; i < repliesCount; i++) {
          const replyer =
            communityUsers[Math.floor(Math.random() * communityUsers.length)];

          if (replyer) {
            replies.push({
              user_id: replyer.user_id,
              content: faker.lorem.paragraph(),
            });
          }
        }
        posts.push({
          user_id: poster.user_id,
          content: faker.lorem.paragraph(),
          replies,
        });
      }
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        slug,
        icon,
        is_private: isPrivate,
        admins: {
          connect: [communityUsers[0]],
        },
        members: {
          connect: communityUsers,
        },
        links,
        location: city.name,
        city_id: city.id,
      },
      include: {
        members: {
          select: {
            user_id: true,
          },
        },
      },
    });

    communities.push(community);

    for (const post of posts) {
      const created_at = faker.date.recent({ days: 30 });
      await prisma.communityPost.create({
        data: {
          user_id: post.user_id,
          content: post.content,
          community_id: community.id,
          created_at,
          replies: {
            create: post.replies.map((reply) => ({
              user_id: reply.user_id,
              content: reply.content,
              community_id: community.id,
            })),
          },
        },
      });
    }

    // Seed events
    const eventCount = Math.floor(Math.random() * 50) + 1;
    const events = [];
    for (let i = 0; i < eventCount; i++) {
      let player_count = Math.floor(Math.random() * 12);
      if (player_count < 5) {
        player_count = undefined;
      }

      const registered_players = [];
      const registered_player_count = Math.floor(Math.random() * 20);
      for (let i = 0; i < registered_player_count; i++) {
        const user = users[Math.floor(Math.random() * users.length)];

        if (
          user &&
          !registered_players.some((p) => p.user_id === user.user_id)
        ) {
          registered_players.push({
            name: user.display_name,
            user_id: user.user_id,
          });
        }
      }

      const start = faker.date.future();
      const end = dayjs(start)
        .add(Math.floor(Math.random() * 5), "hour")
        .toDate();

      const event = {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        start,
        end,
        location: faker.location.city(),
        community_id: community.id,
        player_count,
        registered_players,
      };

      events.push(event);
    }

    for (const event of events) {
      await prisma.event.create({
        data: {
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          community_id: event.community_id,
          player_count: event.player_count,
          registered_players: {
            create: event.registered_players.map((player) => ({
              name: player.name,
              user_id: player.user_id,
            })),
          },
          created_at: faker.date.recent({ days: 30 }),
          created_by_id: communityUsers[0].user_id,
        },
      });
    }
  }

  await seedCommunity(
    "ClockTracker",
    "A community for fans of data, deduction, and demons.",
    "https://fly.storage.tigris.dev/clocktracker-storage/avatars/7c42b5db-ee24-48b6-a3b0-3d4f07cbcf0b",
    false,
    [
      {
        user_id: me.user_id,
      },
    ],
    [
      "https://clocktracker.app/",
      "https://twitter.com/me",
      "https://discord.gg/KwMz8ThamT",
    ],
    portland
  );

  for (let i = 0; i < 30; i++) {
    // capitalize the first letter of each word
    const { randomRole } = generateName();
    const name = `${randomRole} ${faker.location.city()}`.replace(
      /\w\S*/g,
      (w) => w.replace(/^\w/, (c) => c.toUpperCase())
    );
    const description = faker.lorem.paragraph();
    const icon = `/img/role/160x160/${randomRole
      .toLowerCase()
      .replace(/ /g, "")
      .replace(/'/g, "")
      .replace(/-/g, "")}.webp`;
    const isPrivate = Math.random() > 0.8;

    await seedCommunity(name, description, icon, isPrivate, []);
  }

  console.log("Seeding games");
  // The goal is to create a number of games at different sizes for each player.
  // This will allow us to test the game list.

  for (const index in users) {
    const user = users[index];
    const gameCount = (() => {
      if (user.user_id === me.user_id) {
        return 100;
      } else if (user.user_id === testUser.user_id) {
        return 200;
      } else if (user.user_id === testUser2.user_id) {
        return 50;
      } else {
        return Math.floor(Math.random() * 50);
      }
    })();
    console.log(
      `Seeding ${gameCount} games for ${user.username} (${+index + 1}/${
        users.length
      })`
    );
    for (let i = 0; i < gameCount; i++) {
      const player_count = Math.floor(Math.random() * 10) + 5;
      const script = scriptList[Math.floor(Math.random() * scriptList.length)];
      const role =
        script.roles[Math.floor(Math.random() * script.roles.length)];

      const grimoirePages = Math.floor(Math.random() * 6) + 1;

      const grimoire = [];
      const players = [];

      for (let i = 0; i < player_count; i++) {
        const player = {
          name: i === 0 ? user.username : faker.person.firstName(),
          id: i === 0 ? user.user_id : null,
          order: i,
          role: script.roles[Math.floor(Math.random() * script.roles.length)],
        };

        players.push(player);
      }

      for (let p = 0; p < grimoirePages; p++) {
        const tokens = [];
        for (let i = 0; i < player_count; i++) {
          const token = {
            player_name: players[i].name,
            player_id: players[i].id,
            role_id: players[i].role.id,
            alignment: players[i].role.initial_alignment,
            is_dead:
              grimoire.some((g) =>
                g.tokens.some((t) => t.player_id === players[i].id && t.is_dead)
              ) || Math.random() < p / grimoirePages,
            order: i,
          };

          tokens.push(token);
        }

        grimoire.push({
          tokens,
        });
      }

      const belongsTo = communities.filter((c) =>
        c.members.some((m) => m.user_id === user.user_id)
      );

      const community = {
        id: undefined,
        name: undefined,
      };

      if (Math.random() > 0.5 && belongsTo.length > 0) {
        const randomCommunity =
          belongsTo[Math.floor(Math.random() * belongsTo.length)];
        community.id = randomCommunity.id;
        community.name = randomCommunity.name;
      }

      // demon bluffs
      const demonBluffs = [];
      if (Math.random() > 0.5) {
        for (let i = 0; i < 3; i++) {
          const role =
            script.roles[Math.floor(Math.random() * script.roles.length)];
          demonBluffs.push(role);
        }
      }
      // fabled
      const fabled = [];
      if (Math.random() > 0.8) {
        const fabledCharacters = await prisma.role.findMany({
          where: {
            type: "FABLED",
          },
        });

        const fabledCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < fabledCount; i++) {
          const role =
            fabledCharacters[
              Math.floor(Math.random() * fabledCharacters.length)
            ];
          fabled.push(role);
        }
      }

      await prisma.game.create({
        data: {
          user_id: user.user_id,
          community_id: community.id,
          community_name: community.name,
          script: script.name,
          script_id: script.id,
          date: faker.date.past(),
          location_type: "ONLINE",
          location: faker.location.city(),
          player_count,
          win_v2:
            Math.random() > 0.5
              ? WinStatus_V2.GOOD_WINS
              : WinStatus_V2.EVIL_WINS,
          notes: faker.lorem.paragraph(),
          storyteller: faker.person.firstName(),
          player_characters: {
            create: [
              {
                name: role.name,
                alignment: role.initial_alignment,
                role_id: role.id,
              },
            ],
          },
          grimoire: {
            create: grimoire.map((g) => ({
              tokens: {
                create: g.tokens,
              },
            })),
          },
          demon_bluffs: {
            create: demonBluffs.map((role) => ({
              name: role.name,
              role_id: role.id,
            })),
          },
          fabled: {
            create: fabled.map((role) => ({
              name: role.name,
              role_id: role.id,
            })),
          },
        },
      });
    }
  }

  console.log("Seeding forum...");

  // Create user groups
  const moderatorGroup = await prisma.userGroup.create({
    data: {
      name: "Moderator",
      color: "#e44d26",
      permissions: [
        "CREATE_THREAD",
        "CREATE_POST",
        "EDIT_OWN_POST",
        "DELETE_OWN_POST",
        "EDIT_ANY_POST",
        "DELETE_ANY_POST",
        "LOCK_THREAD",
        "PIN_THREAD",
        "BAN_USER",
      ],
    },
  });

  const contributorGroup = await prisma.userGroup.create({
    data: {
      name: "Contributor",
      color: "#3b82f6",
      permissions: [
        "CREATE_THREAD",
        "CREATE_POST",
        "EDIT_OWN_POST",
        "DELETE_OWN_POST",
      ],
    },
  });

  // Add the developer user to the Moderator group
  await prisma.userGroupMembership.create({
    data: {
      user_id: me.user_id,
      group_id: moderatorGroup.id,
    },
  });

  // Add testUser to the Contributor group
  await prisma.userGroupMembership.create({
    data: {
      user_id: testUser.user_id,
      group_id: contributorGroup.id,
    },
  });

  // Add a few random users as contributors
  for (let i = 0; i < 5; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    try {
      await prisma.userGroupMembership.create({
        data: {
          user_id: user.user_id,
          group_id: contributorGroup.id,
        },
      });
    } catch {}
  }

  // Create category groups
  const officialGroup = await prisma.forumCategoryGroup.create({
    data: { name: "Official", sort_order: 0 },
  });

  const communityGroup = await prisma.forumCategoryGroup.create({
    data: { name: "Community", sort_order: 1 },
  });

  const staffGroup = await prisma.forumCategoryGroup.create({
    data: { name: "Staff", sort_order: 2 },
  });

  // Create forum categories
  const announcements = await prisma.forumCategory.create({
    data: {
      name: "Announcements",
      slug: "announcements",
      description: "Official announcements from the ClockTracker team",
      sort_order: 0,
      mod_posting_only: true,
      is_announcement: true,
      group_id: officialGroup.id,
    },
  });

  const changelog = await prisma.forumCategory.create({
    data: {
      name: "Changelog",
      slug: "changelog",
      description: "Updates and changes to ClockTracker",
      sort_order: 1,
      group_id: officialGroup.id,
    },
  });

  const appDiscussion = await prisma.forumCategory.create({
    data: {
      name: "App Discussion",
      slug: "app-discussion",
      description: "General discussion about ClockTracker",
      sort_order: 0,
      group_id: communityGroup.id,
    },
  });

  const gameDiscussion = await prisma.forumCategory.create({
    data: {
      name: "Game Discussion",
      slug: "game-discussion",
      description: "Discuss Blood on the Clocktower strategy, stories, and tips",
      sort_order: 1,
      group_id: communityGroup.id,
    },
  });

  const bugReports = await prisma.forumCategory.create({
    data: {
      name: "Bug Reports",
      slug: "bug-reports",
      description: "Report bugs and issues",
      sort_order: 2,
      group_id: communityGroup.id,
    },
  });

  const featureRequests = await prisma.forumCategory.create({
    data: {
      name: "Feature Requests",
      slug: "feature-requests",
      description: "Suggest new features for ClockTracker",
      sort_order: 3,
      group_id: communityGroup.id,
    },
  });

  const offTopic = await prisma.forumCategory.create({
    data: {
      name: "Off Topic",
      slug: "off-topic",
      description: "Chat about anything not related to BotC or ClockTracker",
      sort_order: 4,
      group_id: communityGroup.id,
    },
  });

  const modDiscussion = await prisma.forumCategory.create({
    data: {
      name: "Moderator Discussion",
      slug: "moderator-discussion",
      description: "Private discussion for moderators",
      sort_order: 0,
      is_private: true,
      group_id: staffGroup.id,
      access: {
        create: {
          group_id: moderatorGroup.id,
          can_view: true,
          can_post: true,
        },
      },
    },
  });

  // Helper to pick a random user
  const randomUser = () => users[Math.floor(Math.random() * users.length)];

  // Emoji options for reactions
  const EMOJI_OPTIONS = ["👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🤔", "👏", "🔥", "😈", "💀", "👹", "🩸", "👻", "⚰️"];

  // Helper: create a thread with N faker posts and optional reactions/edits
  async function seedThread(categoryId, title, postCount, options = {}) {
    const { pinned = false, locked = false, addReactions = false, addEdits = false } = options;
    const threadAuthor = randomUser();
    // Thread starts 1-3 months ago so replies scatter into recent weeks
    const created_at = faker.date.between({
      from: dayjs().subtract(3, "months").toDate(),
      to: dayjs().subtract(1, "months").toDate(),
    });

    // Replies are scattered between thread creation and now, but never in the future
    const now = new Date();
    const timeSpan = now.getTime() - created_at.getTime();

    const thread = await prisma.forumThread.create({
      data: {
        title,
        category_id: categoryId,
        author_id: threadAuthor.user_id,
        created_at,
        last_post_at: created_at,
        is_pinned: pinned,
        is_locked: locked,
        posts: {
          create: {
            body: faker.lorem.paragraphs({ min: 1, max: 4 }),
            author_id: threadAuthor.user_id,
            created_at,
          },
        },
      },
    });

    // Create a subscription for the thread author
    await prisma.forumThreadSubscription.create({
      data: {
        thread_id: thread.id,
        user_id: threadAuthor.user_id,
        last_read_at: created_at,
      },
    });

    const allPostIds = [];
    const firstPost = await prisma.forumPost.findFirst({
      where: { thread_id: thread.id },
    });
    if (firstPost) allPostIds.push(firstPost.id);

    // Generate staggered reply times scattered across the full timespan
    const replyOffsets = [];
    for (let i = 1; i < postCount; i++) {
      replyOffsets.push(Math.random());
    }
    replyOffsets.sort();

    let lastPostAt = created_at;
    for (let i = 1; i < postCount; i++) {
      const replyAuthor = randomUser();
      const replyDate = new Date(
        created_at.getTime() + timeSpan * replyOffsets[i - 1]
      );
      lastPostAt = replyDate;

      const post = await prisma.forumPost.create({
        data: {
          body: faker.lorem.paragraphs({ min: 1, max: 3 }),
          thread_id: thread.id,
          author_id: replyAuthor.user_id,
          created_at: replyDate,
        },
      });
      allPostIds.push(post.id);

      // Randomly subscribe some repliers
      if (Math.random() > 0.5) {
        try {
          await prisma.forumThreadSubscription.create({
            data: {
              thread_id: thread.id,
              user_id: replyAuthor.user_id,
              last_read_at: replyDate,
            },
          });
        } catch {}
      }
    }

    await prisma.forumThread.update({
      where: { id: thread.id },
      data: { last_post_at: lastPostAt },
    });

    // Add reactions to random posts
    if (addReactions) {
      for (const postId of allPostIds) {
        const reactionCount = Math.floor(Math.random() * 8);
        for (let r = 0; r < reactionCount; r++) {
          const reactor = randomUser();
          const emoji = EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
          try {
            await prisma.forumPostReaction.create({
              data: { post_id: postId, user_id: reactor.user_id, emoji },
            });
          } catch {}
        }
      }
    }

    // Add edit history to some posts
    if (addEdits && allPostIds.length > 2) {
      const editCount = Math.floor(Math.random() * 3) + 1;
      for (let e = 0; e < editCount; e++) {
        const postId = allPostIds[Math.floor(Math.random() * allPostIds.length)];
        const post = await prisma.forumPost.findUnique({ where: { id: postId } });
        if (post && !post.deleted_at) {
          await prisma.forumPostEdit.create({
            data: {
              post_id: postId,
              previous_body: post.body,
              edited_by: post.author_id,
            },
          });
          await prisma.forumPost.update({
            where: { id: postId },
            data: {
              body: post.body + "\n\n**Edit:** " + faker.lorem.sentence(),
              edited_at: new Date(post.created_at.getTime() + 1000 * 60 * 30),
            },
          });
        }
      }
    }

    return { thread, allPostIds };
  }

  // --- Announcements ---
  await seedThread(announcements.id, "Welcome to ClockTracker Discussions!", 1, { pinned: true });
  await seedThread(announcements.id, "Community Guidelines - Please Read", 1, { pinned: true });

  // --- Changelog ---
  await seedThread(changelog.id, "v2.5.0 - Forum Feature Added!", 8, { pinned: true, addReactions: true });
  await seedThread(changelog.id, "v2.4.0 - Improved Game Statistics", 5, { addReactions: true });
  await seedThread(changelog.id, "v2.3.0 - Community Events Overhaul", 4);
  await seedThread(changelog.id, "v2.2.0 - Dark Mode Improvements", 6, { addReactions: true });
  await seedThread(changelog.id, "v2.1.0 - Mobile Responsive Redesign", 3);

  // --- App Discussion (including some large threads) ---
  console.log("  Creating large discussion threads...");
  await seedThread(appDiscussion.id, "Introduce yourself!", 60, { pinned: true, addReactions: true, addEdits: true });
  await seedThread(appDiscussion.id, "What features would you like to see next?", 35, { addReactions: true, addEdits: true });
  await seedThread(appDiscussion.id, "How do you use ClockTracker at your table?", 15, { addReactions: true });
  await seedThread(appDiscussion.id, "Feedback on the new UI changes", 12, { addReactions: true, addEdits: true });
  await seedThread(appDiscussion.id, "Best practices for tracking games", 8);
  await seedThread(appDiscussion.id, "ClockTracker vs other tracking tools", 22, { addReactions: true });

  // --- Game Discussion (with large threads) ---
  console.log("  Creating game discussion threads...");
  await seedThread(gameDiscussion.id, "The ULTIMATE Trouble Brewing strategy guide", 55, { addReactions: true, addEdits: true });
  await seedThread(gameDiscussion.id, "Most memorable game moments - share yours!", 45, { addReactions: true });
  await seedThread(gameDiscussion.id, "How to play the Drunk effectively", 18, { addReactions: true });
  await seedThread(gameDiscussion.id, "Sects & Violets: Underrated characters", 14, { addReactions: true });
  await seedThread(gameDiscussion.id, "Tips for new Storytellers", 28, { addReactions: true, addEdits: true });
  await seedThread(gameDiscussion.id, "What's your favorite script to play?", 20, { addReactions: true });
  await seedThread(gameDiscussion.id, "Hot take: The Recluse is the best Outsider", 32, { addReactions: true });
  await seedThread(gameDiscussion.id, "Custom scripts - share your creations!", 16, { addReactions: true });
  await seedThread(gameDiscussion.id, "Bad Moon Rising: A love letter", 11);
  await seedThread(gameDiscussion.id, "How do you organize your local group?", 9);
  await seedThread(gameDiscussion.id, "Snake Charmer appreciation thread", 7, { addReactions: true });
  await seedThread(gameDiscussion.id, "Dealing with cheating players - advice needed", 24, { addReactions: true, addEdits: true });

  // --- Bug Reports ---
  await seedThread(bugReports.id, "Game notes not saving on mobile", 6, { addReactions: true });
  await seedThread(bugReports.id, "Grimoire display issue with large player counts", 4);
  await seedThread(bugReports.id, "Login loop on Firefox 120+", 8, { addEdits: true });
  await seedThread(bugReports.id, "Stats page shows wrong win rate", 5, { addReactions: true });
  await seedThread(bugReports.id, "Community events not appearing in calendar", 3);
  await seedThread(bugReports.id, "Search results include deleted games", 7);
  await seedThread(bugReports.id, "Profile picture upload fails on slow connections", 4);

  // --- Feature Requests ---
  await seedThread(featureRequests.id, "Dark mode for the Grimoire", 12, { addReactions: true });
  await seedThread(featureRequests.id, "Export game history to PDF", 8, { addReactions: true });
  await seedThread(featureRequests.id, "Integration with online BotC platforms", 6);
  await seedThread(featureRequests.id, "Ability to tag games with custom labels", 10, { addReactions: true });
  await seedThread(featureRequests.id, "Tournament bracket support", 15, { addReactions: true, addEdits: true });
  await seedThread(featureRequests.id, "Year-in-review improvements", 9, { addReactions: true });
  await seedThread(featureRequests.id, "Multi-language support", 7);
  await seedThread(featureRequests.id, "Push notifications for forum replies", 5, { addReactions: true });

  // --- Off Topic ---
  await seedThread(offTopic.id, "What board games are you playing besides BotC?", 30, { addReactions: true });
  await seedThread(offTopic.id, "Share your BotC-themed snacks!", 18, { addReactions: true });
  await seedThread(offTopic.id, "The music thread - what are you listening to?", 25, { addReactions: true });
  await seedThread(offTopic.id, "Pet photos! Show us your familiars", 22, { addReactions: true });
  await seedThread(offTopic.id, "Movie recommendations for BotC fans", 14);

  // --- Moderator Discussion ---
  await seedThread(modDiscussion.id, "Forum moderation guidelines", 6, { addEdits: true });
  await seedThread(modDiscussion.id, "Handling rule violations - process", 4);
  await seedThread(modDiscussion.id, "Spam accounts to watch out for", 3);

  // Auto-add anyone who posted in Moderator Discussion to the Moderator group
  const modPosts = await prisma.forumPost.findMany({
    where: {
      thread: { category_id: modDiscussion.id },
      deleted_at: null,
    },
    select: { author_id: true },
    distinct: ["author_id"],
  });
  for (const post of modPosts) {
    if (post.author_id === me.user_id) continue; // already a moderator
    try {
      await prisma.userGroupMembership.create({
        data: {
          user_id: post.author_id,
          group_id: moderatorGroup.id,
        },
      });
    } catch {} // ignore duplicate membership
  }

  // --- Locked thread example ---
  await seedThread(appDiscussion.id, "[RESOLVED] Server downtime 2025-12-15", 10, { locked: true });

  // --- Deleted post example ---
  const deletedThread = await seedThread(offTopic.id, "Thread with some deleted content", 8);
  if (deletedThread.allPostIds.length > 3) {
    await prisma.forumPost.update({
      where: { id: deletedThread.allPostIds[2] },
      data: { deleted_at: new Date() },
    });
  }

  // --- Reports ---
  console.log("  Seeding forum reports...");
  const allPosts = await prisma.forumPost.findMany({
    where: { deleted_at: null },
    take: 200,
    select: { id: true, author_id: true },
  });

  for (let i = 0; i < 8; i++) {
    const post = allPosts[Math.floor(Math.random() * allPosts.length)];
    let reporter = randomUser();
    while (reporter.user_id === post.author_id) {
      reporter = randomUser();
    }
    try {
      await prisma.forumPostReport.create({
        data: {
          post_id: post.id,
          reporter_id: reporter.user_id,
          reason: faker.helpers.arrayElement([
            "Spam or advertising",
            "Offensive language",
            "Off-topic / derailing the thread",
            "Contains spoilers without proper tags",
            "Harassment or personal attacks",
            "Misinformation about game rules",
          ]),
          resolved: i < 3,
          resolved_by: i < 3 ? me.user_id : null,
          resolved_at: i < 3 ? faker.date.recent() : null,
        },
      });
    } catch {}
  }

  // --- Mod log entries ---
  console.log("  Seeding mod log...");

  // Define banned users early so mod log can reference them
  const bannedUser1 = users[users.length - 1];
  const bannedUser2 = users[users.length - 2];

  // Gather real IDs for mod log entries
  const someThreads2 = await prisma.forumThread.findMany({ take: 10 });
  const somePosts = await prisma.forumPost.findMany({ where: { deleted_at: null }, take: 10 });
  const someReports = await prisma.forumPostReport.findMany({ take: 5 });
  const pickThread = () => someThreads2[Math.floor(Math.random() * someThreads2.length)];
  const pickPost = () => somePosts[Math.floor(Math.random() * somePosts.length)];

  const modActions = [
    { action: "PIN_THREAD", target_type: "thread", target_id: pickThread().id, details: null },
    { action: "LOCK_THREAD", target_type: "thread", target_id: pickThread().id, details: "Resolved issue" },
    { action: "DELETE_POST", target_type: "post", target_id: pickPost().id, details: "Spam content" },
    { action: "DELETE_POST", target_type: "post", target_id: pickPost().id, details: "Violated community guidelines" },
    { action: "BAN_USER", target_type: "user", target_id: bannedUser1.user_id, details: "Repeated spam" },
    { action: "RESOLVE_REPORT", target_type: "report", target_id: someReports.length > 0 ? someReports[0].id : uuidv4(), details: null },
    { action: "UNPIN_THREAD", target_type: "thread", target_id: pickThread().id, details: null },
    { action: "UNLOCK_THREAD", target_type: "thread", target_id: pickThread().id, details: "User requested reopen" },
  ];

  for (const action of modActions) {
    await prisma.forumModLog.create({
      data: {
        actor_id: me.user_id,
        action: action.action,
        target_type: action.target_type,
        target_id: action.target_id,
        details: action.details,
        created_at: faker.date.recent({ days: 30 }),
      },
    });
  }

  // --- Bans ---
  console.log("  Seeding forum bans...");

  await prisma.forumBan.create({
    data: {
      user_id: bannedUser1.user_id,
      banned_by: me.user_id,
      reason: "Repeated spam and advertising",
      expires_at: null,
    },
  });

  await prisma.forumBan.create({
    data: {
      user_id: bannedUser2.user_id,
      banned_by: me.user_id,
      reason: "Temporary ban for off-topic posting",
      category_id: appDiscussion.id,
      expires_at: dayjs().add(7, "day").toDate(),
    },
  });

  // --- Subscribe the dev user to a few threads ---
  const someThreads = await prisma.forumThread.findMany({ take: 10 });
  for (const t of someThreads) {
    try {
      await prisma.forumThreadSubscription.create({
        data: {
          thread_id: t.id,
          user_id: me.user_id,
          last_read_at: faker.date.recent({ days: 7 }),
        },
      });
    } catch {}
  }

  console.log("Done!");
  console.log(`Login details:

Email: ${email}
Password: ${myPassword}
User ID: ${resolvedUserId}

Run "npm run dev" and go to http://localhost:3000/`);
}

function generateName() {
  const availableNames = roleNames.filter(
    (role) => !role.toLowerCase().includes("legacy")
  );

  const randomRole =
    availableNames[Math.floor(Math.random() * availableNames.length)] ||
    "Traveler";
  const adjective = faker.word.adjective();

  const username = faker.internet.username({
    firstName: adjective,
    lastName: randomRole,
  });
  const display_name =
    adjective.charAt(0).toUpperCase() + adjective.slice(1) + " " + randomRole;

  return {
    username,
    display_name,
    randomRole,
  };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
