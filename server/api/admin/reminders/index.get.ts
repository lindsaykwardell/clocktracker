import type { ReminderType } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const reminders = await prisma.roleReminder.findMany({
    select: {
      id: true,
      role_id: true,
      reminder: true,
      type: true,
      role: {
        select: {
          name: true,
          type: true,
          custom_role: true,
        },
      },
    },
    orderBy: [{ role: { type: "asc" } }, { role: { name: "asc" } }, { reminder: "asc" }],
  });

  const sorted = reminders.toSorted((a, b) => {
    const aCustom = a.role.custom_role ? 1 : 0;
    const bCustom = b.role.custom_role ? 1 : 0;
    if (aCustom !== bCustom) return aCustom - bCustom;

    const roleCmp = a.role.name.localeCompare(b.role.name, undefined, {
      sensitivity: "base",
    });
    if (roleCmp !== 0) return roleCmp;

    return a.reminder.localeCompare(b.reminder);
  });

  return sorted.map((row) => ({
    id: row.id,
    role_id: row.role_id,
    role_name: row.role.name,
    role_type: row.role.type,
    role_custom: row.role.custom_role,
    reminder: row.reminder,
    type: row.type as ReminderType,
  }));
});
