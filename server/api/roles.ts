import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async () => {
  const prisma = new PrismaClient();

  return await prisma.role.findMany();
});
