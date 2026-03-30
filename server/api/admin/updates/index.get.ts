import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { hasPermission } from "~/server/utils/permissions";
import { getAppUpdateStatuses } from "~/server/updates/runner";

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  return await getAppUpdateStatuses();
});
