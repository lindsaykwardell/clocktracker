const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient, WinStatus, WinStatus_V2 } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const { roles, roleNames, reminders } = require("./roles");
const citySeed = require("./city-seed.json");
const { createClient } = require("@supabase/supabase-js");
const scripts = require("./scripts.json");

const prisma = new PrismaClient();
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
      avatar: "/img/default.png",
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
      avatar: "/img/default.png",
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
  const email = process.env.LOCAL_PASSWORD || "dev@clocktracker.app";

  const data = await supabase.auth.signUp({
    email,
    password: myPassword,
  });

  const me = await prisma.userSettings.create({
    data: {
      user_id: data.data.user.id,
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
        avatar: `/img/role/${randomRole
          .toLowerCase()
          .replace(/ /g, "")
          .replace(/'/g, "")
          .replace(/-/g, "")}.png`,
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
      const created_at = faker.date.past();
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
          created_at: event.start,
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
    const icon = "/img/default.png";
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

  console.log("Done!");
  console.log(`Login details:
    
Email: ${email}
Password: ${myPassword}

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
