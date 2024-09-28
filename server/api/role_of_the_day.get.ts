import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const roleCount = await prisma.role.count({
    where: {
      custom_role: false,
    },
  });

  console.log(roleCount + " roles");

  // Get a random role based on the count and the current date
  const roleIndex = new Date().getDate() % roleCount;

  console.log("Selected role index", roleIndex);

  const role = await prisma.role.findFirst({
    where: {
      custom_role: false,
    },
    // include: {
    //   scripts: {
    //     where: {
    //       is_custom_script: false,
    //     },
    //     select: {
    //       name: true,
    //     },
    //     take: 5,
    //     orderBy: {
    //       games: {
    //         _count: "desc",
    //       },
    //     },
    //   },
    // },
    skip: roleIndex,
  });

  console.log(role);

  return role;
});
