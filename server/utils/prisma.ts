import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/nextjs-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create connection pools for Prisma 7 adapter
const connectionString = process.env.DATABASE_URL;

let pool: Pool | undefined;
let adapter: PrismaPg | undefined;

try {
  if (connectionString) {
    pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  }
} catch (error) {
  console.error("Error initializing Prisma adapter:", error);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
