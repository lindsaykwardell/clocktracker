import { PrismaClient, Alignment } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : undefined;
const adapter = pool ? new PrismaPg(pool) : undefined;

const prisma = new PrismaClient({
  adapter,
});

// Configuration
const DRY_RUN = process.env.DRY_RUN === "1";
const REVERT = process.env.REVERT === "1";
const BACKUP_ONLY = process.env.BACKUP_ONLY === "1";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "1000", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "10", 10);
const START_CURSOR = process.env.START_CURSOR ?? undefined;
const USER_ID = process.env.USER_ID ?? undefined;
const BACKUP_FILE =
  process.env.BACKUP_FILE ??
  path.join(__dirname, `alignment-backup-${Date.now()}.jsonl`);

// Backup file handle (opened lazily)
let backupStream: fs.WriteStream | null = null;

function getBackupStream(): fs.WriteStream {
  if (!backupStream) {
    backupStream = fs.createWriteStream(BACKUP_FILE, { flags: "a" });
  }
  return backupStream;
}

function closeBackupStream(): Promise<void> {
  return new Promise((resolve) => {
    if (backupStream) {
      backupStream.end(() => resolve());
    } else {
      resolve();
    }
  });
}

// Write backup entry for a game's characters
function writeBackup(
  gameId: string,
  characters: Array<{
    name: string;
    alignment: string;
    related: string | null;
    role_id: string | null;
    related_role_id: string | null;
  }>
) {
  const entry = JSON.stringify({ gameId, characters });
  getBackupStream().write(entry + "\n");
}

// Build base where clause for filtering
function buildWhereClause(cursor?: string) {
  const conditions: Record<string, unknown>[] = [
    { deleted: false }, // Always skip deleted games
  ];

  if (USER_ID) {
    conditions.push({ user_id: USER_ID });
  }
  if (cursor) {
    conditions.push({ id: { gt: cursor } });
  }

  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

// Progress tracking
let processed = 0;
let updated = 0;
let errors = 0;
let lastProcessedId = "";

function pushEntry(
  arr: Array<{
    name: string;
    alignment: Alignment;
    related: string;
    role_id: string | null;
    related_role_id: string | null;
  }>,
  token: {
    role_id: string | null;
    related_role_id: string | null;
    alignment: string;
    role: { name: string } | null;
    related_role: { name: string } | null;
  }
) {
  const last = arr[arr.length - 1];
  if (
    last &&
    last.role_id === token.role_id &&
    last.related_role_id === token.related_role_id &&
    last.alignment === token.alignment
  )
    return;
  arr.push({
    name: token.role?.name ?? "",
    alignment: token.alignment as Alignment,
    related: token.related_role?.name ?? "",
    role_id: token.role_id,
    related_role_id: token.related_role_id,
  });
}

async function rebuildGame(gameId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      grimoire: {
        orderBy: { id: "asc" },
        include: {
          tokens: {
            orderBy: { order: "asc" },
            include: { role: true, related_role: true },
          },
        },
      },
      player_characters: true,
    },
  });
  if (!game) return false;

  const timelines = new Map<
    string,
    Array<{
      name: string;
      alignment: Alignment;
      related: string;
      role_id: string | null;
      related_role_id: string | null;
    }>
  >();

  for (const page of game.grimoire) {
    for (const token of page.tokens) {
      const key = token.player_id ?? token.player_name ?? "";
      if (!key) continue;
      const arr = timelines.get(key) ?? [];
      pushEntry(arr, token);
      timelines.set(key, arr);
    }
  }

  const myTimeline = timelines.get(game.user_id) ?? [];
  if (!myTimeline.length) return false;

  // Backup current characters before modifying
  if (!DRY_RUN) {
    writeBackup(
      game.id,
      game.player_characters.map((c) => ({
        name: c.name,
        alignment: c.alignment,
        related: c.related,
        role_id: c.role_id,
        related_role_id: c.related_role_id,
      }))
    );
  }

  if (DRY_RUN) {
    console.log(
      `Would update game ${game.id}: ${game.player_characters.length} -> ${myTimeline.length}`
    );
    return true;
  }

  await prisma.$transaction([
    prisma.character.deleteMany({
      where: { game_id: game.id },
    }),
    prisma.character.createMany({
      data: myTimeline.map((c) => ({
        ...c,
        game_id: game.id,
      })),
    }),
  ]);

  return true;
}

// Simple concurrency limiter
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const promise = (async () => {
      const result = await processor(item);
      results.push(result);
    })();

    executing.add(promise);
    promise.finally(() => executing.delete(promise));

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function printProgress(total: number, startTime: number, label = "Updated") {
  const elapsed = Date.now() - startTime;
  const rate = processed / (elapsed / 1000);
  const remaining = total - processed;
  const eta = remaining / rate;

  const percent = ((processed / total) * 100).toFixed(1);
  const bar = "█".repeat(Math.floor((processed / total) * 30)).padEnd(30, "░");

  process.stdout.write(
    `\r[${bar}] ${percent}% | ${processed}/${total} | ` +
      `${label}: ${updated} | Errors: ${errors} | ` +
      `${rate.toFixed(1)}/s | ETA: ${formatDuration(eta * 1000)} | ` +
      `Last: ${lastProcessedId.slice(0, 8)}...`
  );
}

async function processBatch(
  gameIds: { id: string }[],
  total: number,
  startTime: number
) {
  await processWithConcurrency(gameIds, CONCURRENCY, async ({ id }) => {
    try {
      const didUpdate = await rebuildGame(id);
      if (didUpdate) updated++;
      lastProcessedId = id;
    } catch (err) {
      errors++;
      console.error(`\nError processing game ${id}:`, err);
    } finally {
      processed++;
      printProgress(total, startTime);
    }
  });
}

// ============================================================================
// REVERT MODE
// ============================================================================

interface BackupEntry {
  gameId: string;
  characters: Array<{
    name: string;
    alignment: string;
    related: string | null;
    role_id: string | null;
    related_role_id: string | null;
  }>;
}

async function revertGame(entry: BackupEntry): Promise<boolean> {
  if (DRY_RUN) {
    console.log(
      `Would restore game ${entry.gameId}: ${entry.characters.length} characters`
    );
    return true;
  }

  await prisma.$transaction([
    prisma.character.deleteMany({
      where: { game_id: entry.gameId },
    }),
    prisma.character.createMany({
      data: entry.characters.map((c) => ({
        name: c.name,
        alignment: c.alignment as Alignment,
        related: c.related,
        role_id: c.role_id,
        related_role_id: c.related_role_id,
        game_id: entry.gameId,
      })),
    }),
  ]);

  return true;
}

async function runRevert() {
  console.log("=".repeat(60));
  console.log("Alignment Migration - REVERT MODE");
  console.log("=".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`Backup file: ${BACKUP_FILE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log("=".repeat(60));

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`\nError: Backup file not found: ${BACKUP_FILE}`);
    console.log("Make sure to specify the correct BACKUP_FILE path.");
    process.exit(1);
  }

  // Read and parse backup file
  const content = fs.readFileSync(BACKUP_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const entries: BackupEntry[] = lines.map((line) => JSON.parse(line));

  console.log(`\nFound ${entries.length.toLocaleString()} games to restore`);
  console.log("");

  if (entries.length === 0) {
    console.log("Nothing to restore.");
    return;
  }

  const startTime = Date.now();

  // Process in batches with concurrency
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    await processWithConcurrency(batch, CONCURRENCY, async (entry) => {
      try {
        const didRevert = await revertGame(entry);
        if (didRevert) updated++;
        lastProcessedId = entry.gameId;
      } catch (err) {
        errors++;
        console.error(`\nError reverting game ${entry.gameId}:`, err);
      } finally {
        processed++;
        printProgress(entries.length, startTime, "Restored");
      }
    });
  }

  const elapsed = Date.now() - startTime;

  console.log("\n");
  console.log("=".repeat(60));
  console.log("Revert Complete!");
  console.log("=".repeat(60));
  console.log(`Total processed: ${processed.toLocaleString()}`);
  console.log(`Games restored: ${updated.toLocaleString()}`);
  console.log(`Errors: ${errors.toLocaleString()}`);
  console.log(`Duration: ${formatDuration(elapsed)}`);
  console.log("=".repeat(60));
}

// ============================================================================
// BACKUP ONLY MODE
// ============================================================================

async function backupGame(gameId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player_characters: true,
    },
  });
  if (!game || game.player_characters.length === 0) return false;

  writeBackup(
    game.id,
    game.player_characters.map((c) => ({
      name: c.name,
      alignment: c.alignment,
      related: c.related,
      role_id: c.role_id,
      related_role_id: c.related_role_id,
    }))
  );

  return true;
}

async function runBackupOnly() {
  console.log("=".repeat(60));
  console.log("Alignment Migration - BACKUP ONLY MODE");
  console.log("=".repeat(60));
  console.log(`Backup file: ${BACKUP_FILE}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  if (USER_ID) {
    console.log(`Filtering by user: ${USER_ID}`);
  }
  if (START_CURSOR) {
    console.log(`Starting from cursor: ${START_CURSOR}`);
  }
  console.log("=".repeat(60));

  // Count total games
  const totalGames = await prisma.game.count({
    where: buildWhereClause(START_CURSOR),
  });

  console.log(`Total games to backup: ${totalGames.toLocaleString()}`);
  console.log("");

  if (totalGames === 0) {
    console.log("No games to backup.");
    return;
  }

  const startTime = Date.now();
  let cursor: string | undefined = START_CURSOR;

  while (true) {
    const games = await prisma.game.findMany({
      select: { id: true },
      where: buildWhereClause(cursor),
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
    });

    if (games.length === 0) break;

    await processWithConcurrency(games, CONCURRENCY, async ({ id }) => {
      try {
        const didBackup = await backupGame(id);
        if (didBackup) updated++;
        lastProcessedId = id;
      } catch (err) {
        errors++;
        console.error(`\nError backing up game ${id}:`, err);
      } finally {
        processed++;
        printProgress(totalGames, startTime, "Backed up");
      }
    });

    cursor = games[games.length - 1].id;
  }

  await closeBackupStream();

  const elapsed = Date.now() - startTime;

  console.log("\n");
  console.log("=".repeat(60));
  console.log("Backup Complete!");
  console.log("=".repeat(60));
  console.log(`Total processed: ${processed.toLocaleString()}`);
  console.log(`Games backed up: ${updated.toLocaleString()}`);
  console.log(`Errors: ${errors.toLocaleString()}`);
  console.log(`Duration: ${formatDuration(elapsed)}`);
  console.log(`\nBackup saved to: ${BACKUP_FILE}`);
  console.log(
    `To revert: REVERT=1 BACKUP_FILE="${BACKUP_FILE}" npx tsx prisma/migrate-alignments.ts`
  );
  console.log("=".repeat(60));
}

// ============================================================================
// MIGRATE MODE
// ============================================================================

async function runMigrate() {
  console.log("=".repeat(60));
  console.log("Alignment Migration Script");
  console.log("=".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  if (!DRY_RUN) {
    console.log(`Backup file: ${BACKUP_FILE}`);
  }
  if (USER_ID) {
    console.log(`Filtering by user: ${USER_ID}`);
  }
  if (START_CURSOR) {
    console.log(`Starting from cursor: ${START_CURSOR}`);
  }
  console.log("=".repeat(60));

  // Count total games
  const totalGames = await prisma.game.count({
    where: buildWhereClause(START_CURSOR),
  });

  console.log(`Total games to process: ${totalGames.toLocaleString()}`);
  console.log("");

  if (totalGames === 0) {
    console.log("No games to process.");
    return;
  }

  const startTime = Date.now();
  let cursor: string | undefined = START_CURSOR;

  while (true) {
    // Fetch next batch of game IDs
    const games = await prisma.game.findMany({
      select: { id: true },
      where: buildWhereClause(cursor),
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
    });

    if (games.length === 0) break;

    // Process this batch with concurrency
    await processBatch(games, totalGames, startTime);

    // Update cursor for next batch
    cursor = games[games.length - 1].id;
  }

  await closeBackupStream();

  const elapsed = Date.now() - startTime;

  console.log("\n");
  console.log("=".repeat(60));
  console.log("Migration Complete!");
  console.log("=".repeat(60));
  console.log(`Total processed: ${processed.toLocaleString()}`);
  console.log(`Games updated: ${updated.toLocaleString()}`);
  console.log(`Errors: ${errors.toLocaleString()}`);
  console.log(`Duration: ${formatDuration(elapsed)}`);
  console.log(`Average rate: ${(processed / (elapsed / 1000)).toFixed(1)}/s`);
  if (!DRY_RUN && updated > 0) {
    console.log(`\nBackup saved to: ${BACKUP_FILE}`);
    console.log(
      `To revert: REVERT=1 BACKUP_FILE="${BACKUP_FILE}" npx tsx prisma/migrate-alignments.ts`
    );
  }
  if (lastProcessedId) {
    console.log(`\nLast processed ID: ${lastProcessedId}`);
    console.log(`(Use START_CURSOR=${lastProcessedId} to resume from here)`);
  }
  console.log("=".repeat(60));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  if (REVERT) {
    await runRevert();
  } else if (BACKUP_ONLY) {
    await runBackupOnly();
  } else {
    await runMigrate();
  }
}

main()
  .catch((err) => {
    console.error("\nFatal error:", err);
    if (lastProcessedId) {
      console.log(`\nTo resume, run with: START_CURSOR=${lastProcessedId}`);
    }
    process.exit(1);
  })
  .finally(async () => {
    await closeBackupStream();
    await prisma.$disconnect();
  });
