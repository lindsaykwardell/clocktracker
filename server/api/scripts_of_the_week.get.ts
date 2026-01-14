import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  return getScriptsOfTheWeek(prisma);
});
