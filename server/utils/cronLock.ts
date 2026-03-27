import { PrismaClient } from "~/server/generated/prisma/client";
import { prisma } from "./prisma";

const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes

export async function performLockedTask(
  task_id: string,
  callback: (prisma: PrismaClient) => Promise<void>
) {
  // Try to create the lock row
  try {
    await prisma.cronLock.create({
      data: {
        task_id: task_id,
      },
    });
  } catch (e: any) {
    // Unique constraint violation means a lock row exists
    if (e?.code === "P2002") {
      // Check if the lock is stale (e.g. machine crashed during previous run)
      const existing = await prisma.cronLock.findUnique({
        where: { task_id },
      });

      if (
        !existing ||
        Date.now() - existing.created_at.getTime() < STALE_LOCK_MS
      ) {
        return; // Lock is fresh, another machine is working on it
      }

      // Stale lock — delete it and try again
      console.warn(`Clearing stale cron lock for task: ${task_id}`);
      await prisma.cronLock.delete({ where: { task_id } });

      try {
        await prisma.cronLock.create({ data: { task_id } });
      } catch {
        return; // Another machine beat us to it
      }
    } else {
      throw e;
    }
  }

  try {
    await callback(prisma);
  } catch (e) {
    console.error(e);
  } finally {
    // Wait a minute before releasing so the other machine doesn't immediately re-run
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    await prisma.cronLock.delete({
      where: {
        task_id: task_id,
      },
    });
  }
}
