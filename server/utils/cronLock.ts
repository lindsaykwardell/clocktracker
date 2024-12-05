import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 10000);
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

  await callback(prisma);

  await prisma.cronLock.delete({
    where: {
      task_id: task_id,
    },
  });
}
