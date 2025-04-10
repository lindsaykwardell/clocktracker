import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getRoleId(role_id: string) {
  const storage = useStorage();

  const existingRoleIds: { id: string; map_id: string }[] = [];

  if (await storage.hasItem("existingRoleIds")) {
    existingRoleIds.push(
      ...((await storage.getItem("existingRoleIds")) as {
        id: string;
        map_id: string;
      }[])
    );
  } else {
    const baseRoles = await prisma.role.findMany({
      where: {
        custom_role: false,
      },
    });

    existingRoleIds.push(
      ...baseRoles.map((role) => ({
        id: role.id,
        map_id: role.id,
      }))
    );

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
  }

  const existingRoleId = existingRoleIds.find(
    (existingRole) => existingRole.id === role_id
  );

  return existingRoleId?.map_id;
}
