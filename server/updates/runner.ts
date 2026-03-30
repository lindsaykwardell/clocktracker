import { prisma } from "~/server/utils/prisma";
import { getAppUpdate, listAppUpdates } from "./registry";
import type { AppUpdateRunOptions, AppUpdateRunStats } from "./types";

const RUNNING_STALE_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getAppUpdateStatuses() {
  const rows = await prisma.appUpdate.findMany({
    orderBy: [{ created_at: "asc" }],
  });

  return listAppUpdates().map((update) => {
    const row = rows.find((r) => r.id === update.id);
    return {
      id: update.id,
      description: update.description,
      status: row?.status ?? "PENDING",
      started_at: row?.started_at ?? null,
      finished_at: row?.finished_at ?? null,
      cursor: row?.cursor ?? null,
      stats: row?.stats ?? null,
      error: row?.error ?? null,
    };
  });
}

export async function runAppUpdate(
  id: string,
  options?: AppUpdateRunOptions
) {
  const update = getAppUpdate(id);
  if (!update) {
    throw new Error(`Unknown update: ${id}`);
  }

  const resolvedOptions = {
    dryRun: !!options?.dryRun,
    batchSize: Math.max(1, options?.batchSize || 200),
    limit: options?.limit && options.limit > 0 ? options.limit : 0,
    force: !!options?.force,
  };

  let row = await prisma.appUpdate.findUnique({ where: { id } });
  if (!row) {
    row = await prisma.appUpdate.create({
      data: {
        id,
        description: update.description,
        status: "PENDING",
      },
    });
  }

  if (row.status === "SUCCESS" && !resolvedOptions.force && !resolvedOptions.dryRun) {
    return {
      skipped: true,
      message: `Update ${id} already succeeded. Use force=true to rerun.`,
      row,
    };
  }

  if (row.status === "RUNNING" && !resolvedOptions.force) {
    const fresh =
      row.started_at &&
      Date.now() - new Date(row.started_at).getTime() < RUNNING_STALE_MS;
    if (fresh) {
      return {
        skipped: true,
        message: `Update ${id} is already running.`,
        row,
      };
    }
  }

  const previousStatus = row.status;
  const previousCursor = row.cursor;
  const previousFinishedAt = row.finished_at;
  const previousError = row.error;
  const previousStats =
    row.stats && typeof row.stats === "object"
      ? (row.stats as Record<string, unknown>)
      : {};

  row = await prisma.appUpdate.update({
    where: { id },
    data: {
      description: update.description,
      status: "RUNNING",
      error: null,
      finished_at: null,
      started_at: new Date(),
      ...(resolvedOptions.force ? { cursor: null } : {}),
    },
  });

  const checkpoint = async (
    statsPatch: Partial<AppUpdateRunStats>,
    cursor?: string | null
  ) => {
    const current = await prisma.appUpdate.findUnique({ where: { id } });
    const currentStats =
      current?.stats && typeof current.stats === "object"
        ? (current.stats as Record<string, unknown>)
        : {};

    await prisma.appUpdate.update({
      where: { id },
      data: {
        cursor: cursor ?? current?.cursor ?? null,
        stats: {
          ...currentStats,
          ...statsPatch,
          updated_at: new Date().toISOString(),
          dry_run: resolvedOptions.dryRun,
        },
      },
    });
  };

  const log = (message: string, meta?: Record<string, unknown>) => {
    if (meta) {
      console.log(`[app-update:${id}] ${message}`, meta);
      return;
    }
    console.log(`[app-update:${id}] ${message}`);
  };

  try {
    const result = await update.run({
      prisma,
      options: {
        ...resolvedOptions,
        limit: resolvedOptions.limit || Number.POSITIVE_INFINITY,
      },
      initialCursor: resolvedOptions.force ? null : row.cursor,
      checkpoint,
      log,
    });

    const finalStats = {
      ...result,
      dry_run: resolvedOptions.dryRun,
      completed_at: new Date().toISOString(),
    };

    const finishedRow = resolvedOptions.dryRun
      ? await prisma.appUpdate.update({
          where: { id },
          data: {
            // Dry run should not consume the "already succeeded" state.
            status: previousStatus === "RUNNING" ? "PENDING" : previousStatus,
            cursor: previousCursor,
            stats: {
              ...previousStats,
              last_dry_run: finalStats,
            },
            finished_at: previousFinishedAt,
            error: previousError,
          },
        })
      : await prisma.appUpdate.update({
          where: { id },
          data: {
            status: "SUCCESS",
            cursor: result.cursor ?? null,
            stats: finalStats,
            finished_at: new Date(),
            error: null,
          },
        });

    return {
      skipped: false,
      message: resolvedOptions.dryRun
        ? `Dry run for ${id} completed`
        : `Update ${id} completed`,
      row: finishedRow,
      stats: finalStats,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedRow = await prisma.appUpdate.update({
      where: { id },
      data: {
        status: "FAILED",
        error: message,
        finished_at: new Date(),
      },
    });

    const err = new Error(`Update ${id} failed: ${message}`);
    (err as Error & { data?: unknown }).data = failedRow;
    throw err;
  }
}
