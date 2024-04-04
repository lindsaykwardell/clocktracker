const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient, WinStatus } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const { roles, roleNames, reminders } = require("./roles");

const prisma = new PrismaClient();

async function main() {
  const scriptList = [
    {
      id: 5000,
      script_id: 133,
      name: "Trouble Brewing",
      version: "1.0.0",
      author: "The Pandemonium Institute",
      type: "Full",
      json_url:
        "https://botc-scripts.azurewebsites.net/script/133/1.0.0/download",
      pdf_url:
        "https://botc-scripts.azurewebsites.net/script/133/1.0.0/download_pdf",
      characters_last_updated: "2023-08-17T16:27:04.586Z",
      roles: [
        {
          id: "chef",
          name: "Chef",
          initial_alignment: "GOOD",
          token_url: "/img/role/chef.png",
          type: "TOWNSFOLK",
        },
        {
          id: "empath",
          name: "Empath",
          initial_alignment: "GOOD",
          token_url: "/img/role/empath.png",
          type: "TOWNSFOLK",
        },
        {
          id: "fortune_teller",
          name: "Fortune Teller",
          initial_alignment: "GOOD",
          token_url: "/img/role/fortuneteller.png",
          type: "TOWNSFOLK",
        },
        {
          id: "investigator",
          name: "Investigator",
          initial_alignment: "GOOD",
          token_url: "/img/role/investigator.png",
          type: "TOWNSFOLK",
        },
        {
          id: "librarian",
          name: "Librarian",
          initial_alignment: "GOOD",
          token_url: "/img/role/librarian.png",
          type: "TOWNSFOLK",
        },
        {
          id: "mayor",
          name: "Mayor",
          initial_alignment: "GOOD",
          token_url: "/img/role/mayor.png",
          type: "TOWNSFOLK",
        },
        {
          id: "monk",
          name: "Monk",
          initial_alignment: "GOOD",
          token_url: "/img/role/monk.png",
          type: "TOWNSFOLK",
        },
        {
          id: "ravenkeeper",
          name: "Ravenkeeper",
          initial_alignment: "GOOD",
          token_url: "/img/role/ravenkeeper.png",
          type: "TOWNSFOLK",
        },
        {
          id: "slayer",
          name: "Slayer",
          initial_alignment: "GOOD",
          token_url: "/img/role/slayer.png",
          type: "TOWNSFOLK",
        },
        {
          id: "soldier",
          name: "Soldier",
          initial_alignment: "GOOD",
          token_url: "/img/role/soldier.png",
          type: "TOWNSFOLK",
        },
        {
          id: "undertaker",
          name: "Undertaker",
          initial_alignment: "GOOD",
          token_url: "/img/role/undertaker.png",
          type: "TOWNSFOLK",
        },
        {
          id: "virgin",
          name: "Virgin",
          initial_alignment: "GOOD",
          token_url: "/img/role/virgin.png",
          type: "TOWNSFOLK",
        },
        {
          id: "washerwoman",
          name: "Washerwoman",
          initial_alignment: "GOOD",
          token_url: "/img/role/washerwoman.png",
          type: "TOWNSFOLK",
        },
        {
          id: "butler",
          name: "Butler",
          initial_alignment: "GOOD",
          token_url: "/img/role/butler.png",
          type: "OUTSIDER",
        },
        {
          id: "drunk",
          name: "Drunk",
          initial_alignment: "GOOD",
          token_url: "/img/role/drunk.png",
          type: "OUTSIDER",
        },
        {
          id: "recluse",
          name: "Recluse",
          initial_alignment: "GOOD",
          token_url: "/img/role/recluse.png",
          type: "OUTSIDER",
        },
        {
          id: "saint",
          name: "Saint",
          initial_alignment: "GOOD",
          token_url: "/img/role/saint.png",
          type: "OUTSIDER",
        },
        {
          id: "baron",
          name: "Baron",
          initial_alignment: "EVIL",
          token_url: "/img/role/baron.png",
          type: "MINION",
        },
        {
          id: "poisoner",
          name: "Poisoner",
          initial_alignment: "EVIL",
          token_url: "/img/role/poisoner.png",
          type: "MINION",
        },
        {
          id: "scarlet_woman",
          name: "Scarlet Woman",
          initial_alignment: "EVIL",
          token_url: "/img/role/scarletwoman.png",
          type: "MINION",
        },
        {
          id: "spy",
          name: "Spy",
          initial_alignment: "EVIL",
          token_url: "/img/role/spy.png",
          type: "MINION",
        },
        {
          id: "imp",
          name: "Imp",
          initial_alignment: "EVIL",
          token_url: "/img/role/imp.png",
          type: "DEMON",
        },
      ],
    },
    {
      id: 5001,
      script_id: 135,
      name: "Bad Moon Rising",
      version: "1.0.0",
      author: "The Pandemonium Institute",
      type: "Full",
      json_url:
        "https://botc-scripts.azurewebsites.net/script/135/1.0.0/download",
      pdf_url:
        "https://botc-scripts.azurewebsites.net/script/135/1.0.0/download_pdf",
      characters_last_updated: "2023-08-18T00:47:56.577Z",
      roles: [
        {
          id: "chambermaid",
          name: "Chambermaid",
          initial_alignment: "GOOD",
          token_url: "/img/role/chambermaid.png",
          type: "TOWNSFOLK",
        },
        {
          id: "courtier",
          name: "Courtier",
          initial_alignment: "GOOD",
          token_url: "/img/role/courtier.png",
          type: "TOWNSFOLK",
        },
        {
          id: "exorcist",
          name: "Exorcist",
          initial_alignment: "GOOD",
          token_url: "/img/role/exorcist.png",
          type: "TOWNSFOLK",
        },
        {
          id: "fool",
          name: "Fool",
          initial_alignment: "GOOD",
          token_url: "/img/role/fool.png",
          type: "TOWNSFOLK",
        },
        {
          id: "gambler",
          name: "Gambler",
          initial_alignment: "GOOD",
          token_url: "/img/role/gambler.png",
          type: "TOWNSFOLK",
        },
        {
          id: "gossip",
          name: "Gossip",
          initial_alignment: "GOOD",
          token_url: "/img/role/gossip.png",
          type: "TOWNSFOLK",
        },
        {
          id: "grandmother",
          name: "Grandmother",
          initial_alignment: "GOOD",
          token_url: "/img/role/grandmother.png",
          type: "TOWNSFOLK",
        },
        {
          id: "innkeeper",
          name: "Innkeeper",
          initial_alignment: "GOOD",
          token_url: "/img/role/innkeeper.png",
          type: "TOWNSFOLK",
        },
        {
          id: "minstrel",
          name: "Minstrel",
          initial_alignment: "GOOD",
          token_url: "/img/role/minstrel.png",
          type: "TOWNSFOLK",
        },
        {
          id: "pacifist",
          name: "Pacifist",
          initial_alignment: "GOOD",
          token_url: "/img/role/pacifist.png",
          type: "TOWNSFOLK",
        },
        {
          id: "professor",
          name: "Professor",
          initial_alignment: "GOOD",
          token_url: "/img/role/professor.png",
          type: "TOWNSFOLK",
        },
        {
          id: "sailor",
          name: "Sailor",
          initial_alignment: "GOOD",
          token_url: "/img/role/sailor.png",
          type: "TOWNSFOLK",
        },
        {
          id: "tea_lady",
          name: "Tea Lady",
          initial_alignment: "GOOD",
          token_url: "/img/role/tealady.png",
          type: "TOWNSFOLK",
        },
        {
          id: "goon",
          name: "Goon",
          initial_alignment: "GOOD",
          token_url: "/img/role/goon.png",
          type: "OUTSIDER",
        },
        {
          id: "lunatic",
          name: "Lunatic",
          initial_alignment: "GOOD",
          token_url: "/img/role/lunatic.png",
          type: "OUTSIDER",
        },
        {
          id: "moonchild",
          name: "Moonchild",
          initial_alignment: "GOOD",
          token_url: "/img/role/moonchild.png",
          type: "OUTSIDER",
        },
        {
          id: "tinker",
          name: "Tinker",
          initial_alignment: "GOOD",
          token_url: "/img/role/tinker.png",
          type: "OUTSIDER",
        },
        {
          id: "assassin",
          name: "Assassin",
          initial_alignment: "EVIL",
          token_url: "/img/role/assassin.png",
          type: "MINION",
        },
        {
          id: "devils_advocate",
          name: "Devil's Advocate",
          initial_alignment: "EVIL",
          token_url: "/img/role/devilsadvocate.png",
          type: "MINION",
        },
        {
          id: "godfather",
          name: "Godfather",
          initial_alignment: "EVIL",
          token_url: "/img/role/godfather.png",
          type: "MINION",
        },
        {
          id: "mastermind",
          name: "Mastermind",
          initial_alignment: "EVIL",
          token_url: "/img/role/mastermind.png",
          type: "MINION",
        },
        {
          id: "po",
          name: "Po",
          initial_alignment: "EVIL",
          token_url: "/img/role/po.png",
          type: "DEMON",
        },
        {
          id: "pukka",
          name: "Pukka",
          initial_alignment: "EVIL",
          token_url: "/img/role/pukka.png",
          type: "DEMON",
        },
        {
          id: "shabaloth",
          name: "Shabaloth",
          initial_alignment: "EVIL",
          token_url: "/img/role/shabaloth.png",
          type: "DEMON",
        },
        {
          id: "zombuul",
          name: "Zombuul",
          initial_alignment: "EVIL",
          token_url: "/img/role/zombuul.png",
          type: "DEMON",
        },
      ],
    },
    {
      id: 5002,
      script_id: 134,
      name: "Sects and Violets",
      version: "1.0.0",
      author: "The Pandemonium Institute",
      type: "Full",
      json_url:
        "https://botc-scripts.azurewebsites.net/script/134/1.0.0/download",
      pdf_url:
        "https://botc-scripts.azurewebsites.net/script/134/1.0.0/download_pdf",
      characters_last_updated: "2023-08-18T00:48:18.192Z",
      roles: [
        {
          id: "artist",
          name: "Artist",
          initial_alignment: "GOOD",
          token_url: "/img/role/artist.png",
          type: "TOWNSFOLK",
        },
        {
          id: "clockmaker",
          name: "Clockmaker",
          initial_alignment: "GOOD",
          token_url: "/img/role/clockmaker.png",
          type: "TOWNSFOLK",
        },
        {
          id: "dreamer",
          name: "Dreamer",
          initial_alignment: "GOOD",
          token_url: "/img/role/dreamer.png",
          type: "TOWNSFOLK",
        },
        {
          id: "flowergirl",
          name: "Flowergirl",
          initial_alignment: "GOOD",
          token_url: "/img/role/flowergirl.png",
          type: "TOWNSFOLK",
        },
        {
          id: "juggler",
          name: "Juggler",
          initial_alignment: "GOOD",
          token_url: "/img/role/juggler.png",
          type: "TOWNSFOLK",
        },
        {
          id: "mathematician",
          name: "Mathematician",
          initial_alignment: "GOOD",
          token_url: "/img/role/mathematician.png",
          type: "TOWNSFOLK",
        },
        {
          id: "oracle",
          name: "Oracle",
          initial_alignment: "GOOD",
          token_url: "/img/role/oracle.png",
          type: "TOWNSFOLK",
        },
        {
          id: "philosopher",
          name: "Philosopher",
          initial_alignment: "GOOD",
          token_url: "/img/role/philosopher.png",
          type: "TOWNSFOLK",
        },
        {
          id: "sage",
          name: "Sage",
          initial_alignment: "GOOD",
          token_url: "/img/role/sage.png",
          type: "TOWNSFOLK",
        },
        {
          id: "savant",
          name: "Savant",
          initial_alignment: "GOOD",
          token_url: "/img/role/savant.png",
          type: "TOWNSFOLK",
        },
        {
          id: "seamstress",
          name: "Seamstress",
          initial_alignment: "GOOD",
          token_url: "/img/role/seamstress.png",
          type: "TOWNSFOLK",
        },
        {
          id: "snake_charmer",
          name: "Snake Charmer",
          initial_alignment: "GOOD",
          token_url: "/img/role/snakecharmer.png",
          type: "TOWNSFOLK",
        },
        {
          id: "town_crier",
          name: "Town Crier",
          initial_alignment: "GOOD",
          token_url: "/img/role/towncrier.png",
          type: "TOWNSFOLK",
        },
        {
          id: "barber",
          name: "Barber",
          initial_alignment: "GOOD",
          token_url: "/img/role/barber.png",
          type: "OUTSIDER",
        },
        {
          id: "klutz",
          name: "Klutz",
          initial_alignment: "GOOD",
          token_url: "/img/role/klutz.png",
          type: "OUTSIDER",
        },
        {
          id: "mutant",
          name: "Mutant",
          initial_alignment: "GOOD",
          token_url: "/img/role/mutant.png",
          type: "OUTSIDER",
        },
        {
          id: "sweetheart",
          name: "Sweetheart",
          initial_alignment: "GOOD",
          token_url: "/img/role/sweetheart.png",
          type: "OUTSIDER",
        },
        {
          id: "cerenovus",
          name: "Cerenovus",
          initial_alignment: "EVIL",
          token_url: "/img/role/cerenovus.png",
          type: "MINION",
        },
        {
          id: "evil_twin",
          name: "Evil Twin",
          initial_alignment: "EVIL",
          token_url: "/img/role/eviltwin.png",
          type: "MINION",
        },
        {
          id: "pit-hag",
          name: "Pit-Hag",
          initial_alignment: "EVIL",
          token_url: "/img/role/pithag.png",
          type: "MINION",
        },
        {
          id: "witch",
          name: "Witch",
          initial_alignment: "EVIL",
          token_url: "/img/role/witch.png",
          type: "MINION",
        },
        {
          id: "fang_gu",
          name: "Fang Gu",
          initial_alignment: "EVIL",
          token_url: "/img/role/fanggu.png",
          type: "DEMON",
        },
        {
          id: "no_dashii",
          name: "No Dashii",
          initial_alignment: "EVIL",
          token_url: "/img/role/nodashii.png",
          type: "DEMON",
        },
        {
          id: "vigormortis",
          name: "Vigormortis",
          initial_alignment: "EVIL",
          token_url: "/img/role/vigormortis.png",
          type: "DEMON",
        },
        {
          id: "vortox",
          name: "Vortox",
          initial_alignment: "EVIL",
          token_url: "/img/role/vortox.png",
          type: "DEMON",
        },
      ],
    },
  ];

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

  for (const script of scriptList) {
    await prisma.script.create({
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
  }

  console.log("Seeding users");

  const testUser = await prisma.userSettings.create({
    data: {
      user_id: "1d6f5c04-8df4-4bc5-a073-23552f99c011",
      username: "test",
      finished_welcome: true,
      avatar: "/img/default.png",
      email: "me@me.me",
      display_name: "Test User",
      location: "Testville",
      pronouns: "they/them",
      is_admin: false,
      privacy: "PUBLIC",
    },
  });

  const testUser2 = await prisma.userSettings.create({
    data: {
      user_id: "8e5b6688-1688-424a-be33-6a42916e2256",
      username: "test2",
      finished_welcome: true,
      avatar: "/img/default.png",
      email: "me2@me.me",
      display_name: "Test User 2",
      location: "Testville",
      pronouns: "they/them",
      is_admin: false,
      privacy: "PRIVATE",
    },
  });

  const lindsaykwardell = await prisma.userSettings.create({
    data: {
      user_id: "e53045e0-e144-491a-8ef0-0a5240cbd406",
      username: "lindsaykwardell",
      finished_welcome: true,
      avatar:
        "https://cdn.discordapp.com/avatars/645112854265069591/5fd0619567d5a1799be521833cfa8168.png",
      email: "veryme@me.me",
      display_name: "Lindsay Wardell 🏳️‍⚧️",
      bio: "Writing code, killing demons, even when evil.",
      location: "The Internet",
      is_admin: true,
      privacy: "FRIENDS_ONLY",
    },
  });

  const users = [testUser, testUser2, lindsaykwardell];

  for (let i = 0; i < 100; i++) {
    const { username, display_name, randomRole } = generateName();
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
        location: faker.location.city(),
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
        from_user_id: lindsaykwardell.user_id,
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
        friend_id: lindsaykwardell.user_id,
      },
      {
        user_id: lindsaykwardell.user_id,
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
      },
    });

    await prisma.friend.createMany({
      data: [
        {
          user_id: user1.user_id,
          friend_id: user2.user_id,
        },
        {
          user_id: user2.user_id,
          friend_id: user1.user_id,
        },
      ],
    });
  }

  console.log("Seeding communities");
  const communities = [];

  async function seedCommunity(name, description, icon, isPrivate, members) {
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
      await prisma.communityPost.create({
        data: {
          user_id: post.user_id,
          content: post.content,
          community_id: community.id,
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
        },
      });
    }
  }

  await seedCommunity(
    "Rose City Clocktower",
    "A community for fans of Trouble Brewing.",
    "/img/role/godfather.png",
    false,
    [
      {
        user_id: lindsaykwardell.user_id,
      },
    ]
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
      if (user.user_id === lindsaykwardell.user_id) {
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
          win: Math.random() > 0.5 ? WinStatus.WIN : WinStatus.LOSS,
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
}

function generateName() {
  const randomRole =
    roleNames[Math.floor(Math.random() * roleNames.length)] || "Traveler";
  const adjective = faker.word.adjective();

  const username = faker.internet.userName({
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
