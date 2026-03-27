import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";
import { logModAction } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "VIEW_REPORTS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const reportId = handler.context.params!.id;

  const report = await prisma.forumPostReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw createError({ status: 404, statusMessage: "Report not found" });
  }

  await prisma.forumPostReport.update({
    where: { id: reportId },
    data: {
      resolved: true,
      resolved_by: me.id,
      resolved_at: new Date(),
    },
  });

  await logModAction(me.id, "RESOLVE_REPORT", "report", reportId);

  return { success: true };
});
