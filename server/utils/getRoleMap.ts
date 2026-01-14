import { prisma } from "./prisma";

export async function getRoleMap() {
  const storage = useStorage();

  // Check if the role map is already cached
  const cachedRoleMap:
    | {
        id: string;
        map_id: string;
      }[]
    | null = await storage.getItem("roleMap");
  if (cachedRoleMap) {
    return cachedRoleMap;
  }
  // If not, fetch the role map from the database

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

  // Cache the role map for future use
  await storage.setItem("roleMap", existingRoleIds);
  return existingRoleIds;
}

export async function mapOfficialIdToClocktrackerId(
  role_id: string
): Promise<string | undefined> {
  const roleMap = await getRoleMap();
  return roleMap.find((role) => role.id === role_id)?.map_id;
}
