import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export async function performLockedTask(
  task_id: string,
  callback: (prisma: PrismaClient) => Promise<void>
) {
  // Atomic lock acquisition: try to create the lock row, if it already exists
  // (another machine grabbed it), bail out. This eliminates the race condition
  // from the previous findUnique-then-create pattern.
  try {
    await prisma.cronLock.create({
      data: {
        task_id: task_id,
      },
    });
  } catch (e: any) {
    // Unique constraint violation means another machine already holds the lock
    if (e?.code === "P2002") {
      return;
    }
    throw e;
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
