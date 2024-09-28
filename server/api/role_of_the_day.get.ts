import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const roleCount = await prisma.role.count({
    where: {
      custom_role: false,
    },
  });

  const day = new Date().getDate();

  const roleIndex =
    dayjs()
      .startOf("day")
      .add((day % 7) * (day / 30), "seconds")
      .add(day, "minutes")
      .unix() % roleCount;

  const role = await prisma.role.findFirst({
    where: {
      custom_role: false,
    },
    skip: roleIndex,
  });

  return role;
});
