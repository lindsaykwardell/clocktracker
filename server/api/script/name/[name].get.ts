import { PrismaClient, RoleType } from "@prisma/client";
import naturalOrder from "natural-order";
import { isVersionOne } from "~/server/utils/getScriptVersions";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const name = (handler.context.params?.name as string).replace(/_/g, " ");

  let scripts = await prisma.script.findMany({
    where: {
      name,
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

  if (scripts.length <= 0) {
    console.error(`Script not found: ${name}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (scripts.length === 1 && !isVersionOne(scripts[0].version)) {
    const script_ = { ...scripts[0], roles: undefined };

    try {
      await getScriptVersions(script_);

      scripts = await prisma.script.findMany({
        where: {
          name,
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
    } catch (e) {
      console.error(e);
    }
  }

  // If the characters have not been fetched, fetch them
  for (const script of scripts) {
    if (script.roles.length === 0) {
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
        },
        select: {
          roles: {
            where: {
              type: {
                not: RoleType.FABLED,
              },
            },
          },
        },
      });

      script.roles = updated.roles;
    }
  }

  return naturalOrder(scripts).orderBy("desc").sort(["version"]);
});
