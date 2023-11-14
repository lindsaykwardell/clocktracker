import { PrismaClient, RoleType } from "@prisma/client";
// @ts-ignore
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const id_or_name = handler.context.params?.id as string;

  const script = await prisma.script.findFirst({
    where: !isNaN(+id_or_name)
      ? {
          id: +id_or_name,
        }
      : {
          name: {
            equals: decodeURIComponent(id_or_name),
            mode: "insensitive",
          },
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
    console.error(`Script not found: ${id_or_name}`);
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
    )
      .filter((role: { id: string }) => role.id !== "_meta")
      .map((role: { id: string }) => ({ id: role.id.toLowerCase() }));

    // filter out roles that we don't have in the database
    const existingRoles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds.map((role) => role.id),
        },
      },
    });

    const existingRoleIds = existingRoles.map((role) => role.id);
    const knownRoles = roleIds.filter((role) =>
      existingRoleIds.includes(role.id)
    );

    const updated = await prisma.script.update({
      where: {
        id: script.id,
      },
      data: {
        roles: {
          connect: knownRoles,
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
