const { PrismaPg } = require("@prisma/adapter-pg");
const {
  PrismaClient,
  RoleType,
  ReminderType,
  PrivacySetting,
  Alignment,
} = require("../server/generated/prisma/client");

function resolveConnectionString() {
  const raw = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw) {
    const fallback = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
    console.log(`[fixtures] DATABASE_URL not set, using fallback ${fallback}`);
    return fallback;
  }

  try {
    const parsed = new URL(raw);
    const isLocalHost =
      parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    const isDefaultPort = parsed.port === "5432" || parsed.port === "";

    if (isLocalHost && isDefaultPort) {
      parsed.port = "54322";
      const rewritten = parsed.toString();
      if (rewritten !== raw) {
        console.log(
          `[fixtures] Rewriting local DATABASE_URL port 5432 -> 54322 (${rewritten})`
        );
      }
      return rewritten;
    }
  } catch {
    // If URL parsing fails, keep raw value.
  }

  return raw;
}

const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
const prisma = new PrismaClient({ adapter });

const FIXTURE_PREFIX = "[GRIMOIRE FIXTURE]";
const SUPPORTED_ROLE_TYPES = [
  RoleType.TOWNSFOLK,
  RoleType.OUTSIDER,
  RoleType.MINION,
  RoleType.DEMON,
  RoleType.TRAVELER,
];

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function normalizeLimit(value) {
  if (!value) return Infinity;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return Infinity;
  return Math.floor(parsed);
}

function buildParticipantId(roleId, seatIndex) {
  return `fixture-${roleId}-seat-${seatIndex + 1}`;
}

function cloneToken(token) {
  return {
    role_id: token.role_id,
    related_role_id: token.related_role_id,
    alignment: token.alignment,
    is_dead: token.is_dead,
    used_ghost_vote: token.used_ghost_vote,
    order: token.order,
    grimoire_participant_id: token.grimoire_participant_id,
    player_name: token.player_name,
    player_id: token.player_id,
    reminders: token.reminders.map((r) => ({ ...r })),
  };
}

async function cleanupFixturesForUser(userId) {
  const games = await prisma.game.findMany({
    where: {
      user_id: userId,
      script: {
        startsWith: FIXTURE_PREFIX,
      },
    },
    select: {
      id: true,
      grimoire: {
        select: {
          id: true,
          tokens: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (games.length === 0) {
    return { deletedGames: 0, deletedPages: 0, deletedTokens: 0 };
  }

  const gameIds = games.map((g) => g.id);
  const grimoireIds = games.flatMap((g) => g.grimoire.map((p) => p.id));
  const tokenIds = games.flatMap((g) =>
    g.grimoire.flatMap((p) => p.tokens.map((t) => t.id))
  );

  await prisma.favoriteGame.deleteMany({ where: { game_id: { in: gameIds } } });
  await prisma.grimoireEvent.deleteMany({ where: { game_id: { in: gameIds } } });
  await prisma.grimoireSnapshot.deleteMany({ where: { game_id: { in: gameIds } } });
  await prisma.character.deleteMany({ where: { game_id: { in: gameIds } } });
  await prisma.demonBluff.deleteMany({ where: { game_id: { in: gameIds } } });
  await prisma.fabled.deleteMany({ where: { game_id: { in: gameIds } } });

  await prisma.game.updateMany({
    where: { parent_game_id: { in: gameIds } },
    data: { parent_game_id: null },
  });

  await prisma.game.deleteMany({ where: { id: { in: gameIds } } });

  if (tokenIds.length > 0) {
    await prisma.reminderToken.deleteMany({ where: { token_id: { in: tokenIds } } });
    await prisma.token.deleteMany({ where: { id: { in: tokenIds } } });
  }

  if (grimoireIds.length > 0) {
    await prisma.grimoire.deleteMany({ where: { id: { in: grimoireIds } } });
  }

  return {
    deletedGames: gameIds.length,
    deletedPages: grimoireIds.length,
    deletedTokens: tokenIds.length,
  };
}

async function main() {
  const userId = argValue("--user") || process.env.LOCAL_USER_ID;
  if (!userId) {
    throw new Error("Missing --user <uuid> (or set LOCAL_USER_ID)");
  }

  const limit = normalizeLimit(argValue("--limit"));
  const shouldDeleteExisting = hasFlag("--delete-existing");
  const asStoryteller = hasFlag("--as-storyteller");
  const ignoreForStats = hasFlag("--ignore-for-stats");

  const user = await prisma.userSettings.findUnique({
    where: { user_id: userId },
    select: { user_id: true, username: true, display_name: true },
  });

  if (!user) {
    throw new Error(`User not found for user_id=${userId}`);
  }

  if (shouldDeleteExisting) {
    const cleaned = await cleanupFixturesForUser(userId);
    console.log(
      `[fixtures] Deleted existing fixtures: ${cleaned.deletedGames} games, ${cleaned.deletedPages} pages, ${cleaned.deletedTokens} tokens`
    );
  }

  const roles = await prisma.role.findMany({
    where: {
      custom_role: false,
      type: { in: SUPPORTED_ROLE_TYPES },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      initial_alignment: true,
      ability: true,
      token_url: true,
    },
  });

  if (roles.length === 0) {
    console.log("[fixtures] No supported roles found. Nothing to do.");
    return;
  }

  const trackingReminders = await prisma.roleReminder.findMany({
    where: {
      role_id: { in: roles.map((r) => r.id) },
      type: ReminderType.TRACKING,
    },
    orderBy: [{ role_id: "asc" }, { reminder: "asc" }],
    select: {
      role_id: true,
      reminder: true,
    },
  });

  const reminderByRole = new Map();
  for (const entry of trackingReminders) {
    if (!reminderByRole.has(entry.role_id)) {
      reminderByRole.set(entry.role_id, entry.reminder);
    }
  }

  const toCreate = roles.slice(0, Number.isFinite(limit) ? limit : roles.length);
  let createdCount = 0;

  for (let i = 0; i < toCreate.length; i += 1) {
    const targetRole = toCreate[i];

    const fillerPool = roles.filter((r) => r.id !== targetRole.id);
    const fillers = [];
    for (let j = 0; j < 6; j += 1) {
      fillers.push(fillerPool[(i + j) % fillerPool.length]);
    }

    const seatRoles = [targetRole, ...fillers];

    const page1Tokens = seatRoles.map((role, idx) => ({
      role_id: role.id,
      related_role_id: null,
      alignment: role.initial_alignment || Alignment.NEUTRAL,
      is_dead: false,
      used_ghost_vote: false,
      order: idx,
      grimoire_participant_id: buildParticipantId(targetRole.id, idx),
      player_name:
        idx === 0
          ? user.display_name || user.username
          : `Seat ${idx + 1}`,
      player_id: !asStoryteller && idx === 0 ? user.user_id : null,
      reminders: [],
    }));

    const page2Tokens = page1Tokens.map(cloneToken);
    const trackingReminder = reminderByRole.get(targetRole.id);
    if (trackingReminder) {
      page2Tokens[0].reminders.push({
        reminder: trackingReminder,
        token_url: `/img/reminder/${targetRole.id}.webp`,
        type: ReminderType.TRACKING,
      });
    }

    const playerCharacters = asStoryteller
      ? seatRoles.map((role) => ({
          name: role.name,
          role_id: role.id,
          related_role_id: null,
          related: null,
          alignment: role.initial_alignment || Alignment.NEUTRAL,
        }))
      : [
          {
            name: targetRole.name,
            role_id: targetRole.id,
            related_role_id: null,
            related: null,
            alignment: targetRole.initial_alignment || Alignment.NEUTRAL,
          },
        ];

    await prisma.game.create({
      data: {
        user_id: user.user_id,
        date: new Date(),
        script: `${FIXTURE_PREFIX} ${targetRole.type} - ${targetRole.name}`,
        location_type: "ONLINE",
        location: "Fixture Lab",
        community_name: "",
        player_count: 7,
        traveler_count: targetRole.type === RoleType.TRAVELER ? 1 : 0,
        win_v2: "NOT_RECORDED",
        end_trigger: "NOT_RECORDED",
        notes: [
          `${FIXTURE_PREFIX} Auto-generated role fixture for ${targetRole.id}`,
          "",
          "Role ability:",
          targetRole.ability || "(no ability text)",
        ].join("\\n"),
        image_urls: [],
        old_image_urls: [],
        storyteller: user.username,
        co_storytellers: [],
        is_storyteller: asStoryteller,
        ignore_for_stats: ignoreForStats,
        tags: ["fixture", "grimoire", "role-coverage"],
        waiting_for_confirmation: false,
        deleted: false,
        privacy: PrivacySetting.PRIVATE,
        player_characters: {
          create: playerCharacters,
        },
        demon_bluffs: {
          create: [],
        },
        fabled: {
          create: [],
        },
        grimoire_events: {
          create: [],
        },
        grimoire: {
          create: [
            {
              title: "Night 1",
              page_type: "NIGHT",
              tokens: {
                create: page1Tokens.map((token) => ({
                  ...token,
                  reminders: {
                    create: token.reminders,
                  },
                })),
              },
            },
            {
              title: "Day 1",
              page_type: "DAY",
              tokens: {
                create: page2Tokens.map((token) => ({
                  ...token,
                  reminders: {
                    create: token.reminders,
                  },
                })),
              },
            },
          ],
        },
      },
    });

    createdCount += 1;
    if (createdCount % 25 === 0) {
      console.log(`[fixtures] Created ${createdCount}/${toCreate.length} role fixtures...`);
    }
  }

  console.log(`[fixtures] Done. Created ${createdCount} fixture games for user ${user.username}.`);
  console.log(`[fixtures] Prefix: ${FIXTURE_PREFIX}`);
}

main()
  .catch((error) => {
    console.error("[fixtures] Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
