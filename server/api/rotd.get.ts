import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const roleCount = await prisma.role.count({
    where: {
      custom_role: false,
      type: {
        not: "FABLED",
      },
    },
  });

  const roles = [];

  for (let i = 0; i < 90; i++) {
    const roleIndex =
      dayjs()
        .startOf("day")
        .add((i % 7) * (i / 30), "seconds")
        .add(i, "minutes")
        .add(0, "days")
        .unix() % roleCount;

    const role = await prisma.role.findFirst({
      where: {
        custom_role: false,
      },
      skip: roleIndex,
    });

    roles.push(role);
  }

  return roles;
});
