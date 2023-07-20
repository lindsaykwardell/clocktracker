import { PrismaClient, RoleType } from "@prisma/client";
// @ts-ignore
import dayjs from "dayjs";

export default defineEventHandler(async (handler) => {
  const id = parseInt(handler.context.params?.id as string, 10);

  const prisma = new PrismaClient();
  const script = await prisma.script.findUnique({
    where: {
      id,
    },
    include: {
      roles: {
        where: {
          type: {
            not: RoleType.FABLED,
          },
        },
      },
    },
  });

  if (!script) {
    console.error(`Script not found: ${id}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // If the characters have not been fetched in the last two weeks, fetch them again
  if (
    script.characters_last_updated === null ||
    dayjs().diff(script.characters_last_updated, "day") > 14
  ) {
    const roleIds: { id: string }[] = (
      await fetch(script.json_url).then((res) => res.json())
    ).filter((role: { id: string }) => role.id !== "_meta");

    const updated = await prisma.script.update({
      where: {
        id,
      },
      data: {
        roles: {
          connect: roleIds,
        },
        characters_last_updated: new Date(),
      },
      include: {
        roles: {
          where: {
            type: {
              not: RoleType.FABLED,
            },
          },
        },
      },
    });

    return updated;
  }

  return script;
});
