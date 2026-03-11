import { prisma } from "./prisma";

// Default permissions for users with no group memberships
const DEFAULT_PERMISSIONS = [
  "CREATE_THREAD",
  "CREATE_POST",
  "EDIT_OWN_POST",
  "DELETE_OWN_POST",
];

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.userSettings.findUnique({
    where: { user_id: userId },
    select: { is_admin: true },
  });
  return user?.is_admin ?? false;
}

export async function getUserPermissions(
  userId: string
): Promise<string[]> {
  const memberships = await prisma.userGroupMembership.findMany({
    where: { user_id: userId },
    include: { group: true },
  });

  if (memberships.length === 0) {
    return DEFAULT_PERMISSIONS;
  }

  const permissions = new Set<string>(DEFAULT_PERMISSIONS);
  for (const m of memberships) {
    for (const p of m.group.permissions) {
      permissions.add(p);
    }
  }
  return Array.from(permissions);
}

export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}
