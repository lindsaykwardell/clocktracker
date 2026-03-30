const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../server/generated/prisma/client");

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

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const userId = argValue("--user") || process.env.LOCAL_USER_ID;
  if (!userId) {
    throw new Error("Missing --user <uuid> (or set LOCAL_USER_ID)");
  }

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
    console.log("[fixtures] No fixture games found for this user.");
    return;
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

  console.log(
    `[fixtures] Deleted ${gameIds.length} games, ${grimoireIds.length} pages, ${tokenIds.length} tokens.`
  );
}

main()
  .catch((error) => {
    console.error("[fixtures] Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
