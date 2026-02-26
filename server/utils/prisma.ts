import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/nextjs-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Periodically disconnect and reconnect Prisma to release engine memory.
// The Rust-based query engine retains freed memory in its allocator pools;
// disconnecting forces it to release those pools. Prisma auto-reconnects
// on the next query.
if (process.env.NODE_ENV === "production") {
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      console.log("[prisma] Periodic disconnect to release engine memory");
      await prisma.$disconnect();
    } catch (e) {
      console.error("[prisma] Disconnect error:", e);
    }
  }, FOUR_HOURS).unref();
}
