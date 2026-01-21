import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async () => {
  try {
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

    // Return the date as an ISO string or null to ensure it's serializable
    return maintenance?.effective_date ? maintenance.effective_date.toISOString() : null;
  } catch (error) {
    console.error("Error fetching scheduled maintenance:", error);
    return null;
  }
});
