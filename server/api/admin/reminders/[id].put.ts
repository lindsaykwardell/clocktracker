import { ReminderType } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

const ALLOWED_TYPES = new Set<ReminderType>([
  ReminderType.OFFICIAL,
  ReminderType.TRACKING,
  ReminderType.IMPORTED,
  ReminderType.LEGACY,
  ReminderType.CUSTOM,
]);

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const reminderId = Number(event.context.params?.id);
  if (!Number.isInteger(reminderId) || reminderId <= 0) {
    throw createError({ status: 400, statusMessage: "Invalid reminder id" });
  }

  const body = await readBody<{ type?: ReminderType | string }>(event);
  const type = String(body?.type ?? "").toUpperCase() as ReminderType;
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ status: 400, statusMessage: "Invalid reminder type" });
  }

  const updated = await prisma.roleReminder.update({
    where: { id: reminderId },
    data: { type },
    select: {
      id: true,
      type: true,
    },
  });

  return updated;
});
