import { prisma } from "./prisma";

// Lightweight user select for forum responses
export const forumUserSelect = {
  user_id: true,
  username: true,
  display_name: true,
  avatar: true,
  created_at: true,
} as const;

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

export async function getUserForumPermissions(
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

export async function hasForumPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  const permissions = await getUserForumPermissions(userId);
  return permissions.includes(permission);
}

export async function userCanViewCategory(
  userId: string | null,
  categoryId: string,
  isPrivate: boolean
): Promise<boolean> {
  if (!isPrivate) return true;
  if (!userId) return false;
  if (await isAdmin(userId)) return true;

  const access = await prisma.categoryAccess.findFirst({
    where: {
      category_id: categoryId,
      can_view: true,
      group: {
        members: { some: { user_id: userId } },
      },
    },
  });
  return !!access;
}

export async function isModerator(userId: string): Promise<boolean> {
  const permissions = await getUserForumPermissions(userId);
  return (
    permissions.includes("EDIT_ANY_POST") ||
    permissions.includes("DELETE_ANY_POST") ||
    permissions.includes("LOCK_THREAD") ||
    permissions.includes("PIN_THREAD") ||
    permissions.includes("BAN_USER") ||
    permissions.includes("MANAGE_CATEGORIES")
  );
}

export async function userCanPostInCategory(
  userId: string,
  categoryId: string,
  isPrivate: boolean,
  modPostingOnly: boolean = false
): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  if (modPostingOnly) {
    return await isModerator(userId);
  }

  const hasPermission = await hasForumPermission(userId, "CREATE_POST");
  if (!hasPermission) return false;

  if (!isPrivate) return true;

  const access = await prisma.categoryAccess.findFirst({
    where: {
      category_id: categoryId,
      can_post: true,
      group: {
        members: { some: { user_id: userId } },
      },
    },
  });
  return !!access;
}

export async function checkForumBan(
  userId: string,
  categoryId?: string
): Promise<boolean> {
  const ban = await prisma.forumBan.findFirst({
    where: {
      user_id: userId,
      AND: [
        {
          OR: [
            { category_id: null },
            ...(categoryId ? [{ category_id: categoryId }] : []),
          ],
        },
        {
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
      ],
    },
  });
  return !!ban;
}

// Compute display name color for a forum user
// Priority: admin (red) > user group color > kofi supporter (teal) > null
export async function getForumNameColor(userId: string): Promise<string | null> {
  // Check admin
  const user = await prisma.userSettings.findUnique({
    where: { user_id: userId },
    select: { is_admin: true },
  });
  if (user?.is_admin) return "admin";

  // Check user group color
  const memberships = await prisma.userGroupMembership.findMany({
    where: { user_id: userId },
    include: { group: { select: { color: true } } },
  });
  for (const m of memberships) {
    if (m.group.color) return m.group.color;
  }

  // Check KoFi supporter
  const payment = await prisma.koFiPayment.findFirst({
    where: {
      user_id: userId,
      expires_at: { gte: new Date() },
    },
  });
  if (payment) return "supporter";

  return null;
}

// Batch version for multiple users
export async function getForumNameColors(userIds: string[]): Promise<Record<string, string | null>> {
  if (userIds.length === 0) return {};

  const uniqueIds = [...new Set(userIds)];

  // Fetch admin status
  const users = await prisma.userSettings.findMany({
    where: { user_id: { in: uniqueIds } },
    select: { user_id: true, is_admin: true },
  });
  const adminSet = new Set(users.filter((u) => u.is_admin).map((u) => u.user_id));

  // Fetch group colors
  const memberships = await prisma.userGroupMembership.findMany({
    where: { user_id: { in: uniqueIds } },
    include: { group: { select: { color: true } } },
  });
  const groupColorMap = new Map<string, string>();
  for (const m of memberships) {
    if (m.group.color && !groupColorMap.has(m.user_id)) {
      groupColorMap.set(m.user_id, m.group.color);
    }
  }

  // Fetch KoFi supporters
  const payments = await prisma.koFiPayment.findMany({
    where: {
      user_id: { in: uniqueIds },
      expires_at: { gte: new Date() },
    },
    distinct: ["user_id"],
  });
  const supporterSet = new Set(payments.map((p) => p.user_id));

  const result: Record<string, string | null> = {};
  for (const id of uniqueIds) {
    if (adminSet.has(id)) result[id] = "admin";
    else if (groupColorMap.has(id)) result[id] = groupColorMap.get(id)!;
    else if (supporterSet.has(id)) result[id] = "supporter";
    else result[id] = null;
  }
  return result;
}

// Batch compute badges for forum users
// Priority: admin > moderator > supporter > null
const MOD_PERMISSIONS = [
  "EDIT_ANY_POST",
  "DELETE_ANY_POST",
  "LOCK_THREAD",
  "PIN_THREAD",
  "BAN_USER",
  "MANAGE_CATEGORIES",
];

export async function getForumBadges(
  userIds: string[]
): Promise<Record<string, string | null>> {
  if (userIds.length === 0) return {};

  const uniqueIds = [...new Set(userIds)];

  const [users, memberships, payments] = await Promise.all([
    prisma.userSettings.findMany({
      where: { user_id: { in: uniqueIds } },
      select: { user_id: true, is_admin: true },
    }),
    prisma.userGroupMembership.findMany({
      where: { user_id: { in: uniqueIds } },
      include: { group: { select: { permissions: true } } },
    }),
    prisma.koFiPayment.findMany({
      where: {
        user_id: { in: uniqueIds },
        expires_at: { gte: new Date() },
      },
      distinct: ["user_id"],
    }),
  ]);

  const adminSet = new Set(
    users.filter((u) => u.is_admin).map((u) => u.user_id)
  );

  const modSet = new Set<string>();
  for (const m of memberships) {
    if (m.group.permissions.some((p) => MOD_PERMISSIONS.includes(p))) {
      modSet.add(m.user_id);
    }
  }

  const supporterSet = new Set(payments.map((p) => p.user_id));

  const result: Record<string, string | null> = {};
  for (const id of uniqueIds) {
    if (adminSet.has(id)) result[id] = "admin";
    else if (modSet.has(id)) result[id] = "moderator";
    else if (supporterSet.has(id)) result[id] = "supporter";
    else result[id] = null;
  }
  return result;
}

// Mod log
export async function logModAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
): Promise<void> {
  await prisma.forumModLog.create({
    data: {
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || null,
    },
  });
}

// Post body character limit for non-moderators/non-admins
export const POST_BODY_MAX_LENGTH = 10_000;

export async function checkPostLength(
  userId: string,
  body: string
): Promise<void> {
  if (body.length <= POST_BODY_MAX_LENGTH) return;
  if (await isAdmin(userId)) return;

  const permissions = await getUserForumPermissions(userId);
  const isModerator = permissions.includes("EDIT_ANY_POST") || permissions.includes("DELETE_ANY_POST");
  if (isModerator) return;

  throw createError({
    status: 400,
    statusMessage: `Post body cannot exceed ${POST_BODY_MAX_LENGTH.toLocaleString()} characters`,
  });
}

// Rate limiting: returns true if the user should be rate-limited
export async function isRateLimited(
  userId: string,
  type: "thread" | "post"
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  if (type === "thread") {
    const recentThreads = await prisma.forumThread.count({
      where: {
        author_id: userId,
        created_at: { gt: oneMinuteAgo },
        deleted_at: null,
      },
    });
    return recentThreads >= 1;
  }

  const recentPosts = await prisma.forumPost.count({
    where: {
      author_id: userId,
      created_at: { gt: oneMinuteAgo },
      deleted_at: null,
    },
  });
  return recentPosts >= 5;
}
