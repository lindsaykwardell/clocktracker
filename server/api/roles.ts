import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  const roles = await prisma.role.findMany({
    include: {
      reminders: true,
    },
    where: {
      custom_role: false,
    },
  });

  // order roles by type. This is important for the UI
  // The order is:
  // TOWNSFOLK
  // OUTSIDER
  // MINION
  // DEMON
  // TRAVELER
  // FABLED

  const orderedRoles = roles.sort((a, b) => {
    const order = [
      "TOWNSFOLK",
      "OUTSIDER",
      "MINION",
      "DEMON",
      "TRAVELER",
      "FABLED",
    ];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  return orderedRoles;
});
