import { prisma } from "./prisma";

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

  const permissions = new Set<string>();
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

export async function getUserRestrictions(
  userId: string
): Promise<string[]> {
  const memberships = await prisma.userGroupMembership.findMany({
    where: { user_id: userId },
    include: { group: true },
  });

  const restrictions = new Set<string>();
  for (const m of memberships) {
    for (const r of m.group.restrictions) {
      restrictions.add(r);
    }
  }
  return Array.from(restrictions);
}

export async function hasRestriction(
  userId: string,
  restriction: string
): Promise<boolean> {
  // Admins are never restricted
  if (await isAdmin(userId)) return false;

  const restrictions = await getUserRestrictions(userId);
  return restrictions.includes(restriction);
}
