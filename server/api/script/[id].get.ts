import { PrismaClient, RoleType } from "@prisma/client";

const prisma = new PrismaClient();

// This endpoint is specifically for fetching a script by its ID
// This is the ClockTracker ID, not the BOTC script db ID.
export default defineEventHandler(async (handler) => {
  const id = handler.context.params?.id as string;

  const script = await prisma.script.findUnique({
    where: {
      id: +id,
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

  // If the characters have not been fetched, fetch them
  if (script.roles.length === 0) {
    try {
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
    } catch {
      // The script database is either down, or the script doesn't exist in the database
      // We don't want to throw an error here, because we still have the script data
      // We just won't have the roles
      console.error(`Failed to fetch roles for script: ${id}`);

      script.roles = await prisma.role.findMany();
    }
  }

  return script;
});
