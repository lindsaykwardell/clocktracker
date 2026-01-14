import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async () => {
  const maintenance = await prisma.featureFlag.findFirst({
    where: {
      name: "maintenance",
      effective_date: {
        gte: new Date(),
      },
      active: true,
    },
    select: {
      effective_date: true,
    },
  });

  return maintenance?.effective_date;
});
