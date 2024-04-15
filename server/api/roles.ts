import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  return await prisma.role.findMany({
    where: {
      custom_role: false,
    },
    include: {
      reminders: true,
    }
  });
});
