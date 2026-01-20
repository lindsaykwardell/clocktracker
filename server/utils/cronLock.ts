import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

const wait = (time?: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, time ?? Math.random() * 10000);
  });

export async function performLockedTask(
  task_id: string,
  callback: (prisma: PrismaClient) => Promise<void>
) {
  await wait();

  const lock = await prisma.cronLock.findUnique({
    where: {
      task_id: task_id,
    },
  });

  if (lock !== null) {
    return;
  }

  await prisma.cronLock.create({
    data: {
      task_id: task_id,
    },
  });

  try {
    await callback(prisma);
  } catch (e) {
    console.error(e)
  } finally {
    // Wait a minute
    await wait(60 * 1000);

    await prisma.cronLock.delete({
      where: {
        task_id: task_id,
      },
    });
  }
}
