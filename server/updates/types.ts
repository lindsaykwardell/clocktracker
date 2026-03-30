import type { PrismaClient } from "~/server/generated/prisma/client";

export type AppUpdateRunOptions = {
  dryRun?: boolean;
  batchSize?: number;
  limit?: number;
  force?: boolean;
};

export type AppUpdateRunStats = {
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
  cursor: string | null;
  errors: string[];
  [key: string]: unknown;
};

export type AppUpdateContext = {
  prisma: PrismaClient;
  options: Required<AppUpdateRunOptions>;
  initialCursor: string | null;
  checkpoint: (
    stats: Partial<AppUpdateRunStats>,
    cursor?: string | null
  ) => Promise<void>;
  log: (message: string, meta?: Record<string, unknown>) => void;
};

export type AppUpdateDefinition = {
  id: string;
  description: string;
  run: (ctx: AppUpdateContext) => Promise<AppUpdateRunStats>;
};
