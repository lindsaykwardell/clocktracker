import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { fetchScriptJsonRoles } from "~/server/utils/fetchScriptJsonRoles";
import { prisma } from "~/server/utils/prisma";

// This endpoint is specifically for fetching a script by its ID
// This is the ClockTracker ID, not the BOTC script db ID.
export default defineEventHandler(async (handler) => {
  const me = handler.context.user as User | null;
  const id = handler.context.params?.id as string;

  const script = await prisma.script.findUnique({
    where: {
      id: +id,
      OR: [
        // If you own this script
        {
          user_id: {
            equals: me?.id || "",
          },
        },
        // If you have played this script
        {
          games: {
            some: {
              user_id: {
                equals: me?.id || "",
              },
            },
          },
        },
        // If this script is public
        {
          user_id: {
            equals: null,
          },
        },
      ],
    },
    include: {
      roles: {
        include: {
          reminders: true,
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
  if (!script.is_custom_script && !script.download_unavailable) {
    const roleIds = await fetchScriptJsonRoles(script);

    if (roleIds) {
      const baseRoles = await prisma.role.findMany({
        where: {
          custom_role: false,
        },
      });

      const existingRoleIds = baseRoles.map((role) => ({
        id: role.id,
        map_id: role.id,
      }));

      baseRoles.forEach((role) => {
        if (role.id.includes("_")) {
          existingRoleIds.push({
            id: role.id.replaceAll("_", ""),
            map_id: role.id,
          });
        } else if (role.id.includes("-")) {
          existingRoleIds.push({
            id: role.id.replaceAll("-", ""),
            map_id: role.id,
          });
        }
      });

      const knownRoles = roleIds
        .map((role) => {
          const existingRoleId = existingRoleIds.find(
            (existingRole) => existingRole.id === role.id
          );

          if (existingRoleId) {
            return { id: existingRoleId.map_id };
          }
          return role;
        })
        .filter((role) =>
          existingRoleIds.some((existingRole) => existingRole.id === role.id)
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
            include: {
              reminders: true,
            },
          },
        },
      });

      return updated;
    }

    console.error(`Failed to fetch roles for script: ${id}`);
  }

  if (!script.is_custom_script && script.roles.length === 0) {
    script.roles = await prisma.role.findMany({
      where: {
        custom_role: false,
      },
      include: {
        reminders: true,
      },
    });
  }

  return script;
});
