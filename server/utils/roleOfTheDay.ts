import dayjs from "dayjs";
import { prisma } from "./prisma";

export async function roleOfTheDay() {
  const roleCount = await prisma.role.count({
    where: {
      custom_role: false,
      type: {
        not: "FABLED",
      },
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
}
