import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";
import { logModAction, modLogNote } from "~/server/utils/forum";

// Deleting from a report goes through the post's DELETE route instead, so the
// deletion and the resolution land together.
const OUTCOMES = {
  dismissed: "RESOLVE_REPORT_DISMISSED",
  edited: "RESOLVE_REPORT_EDITED",
  banned: "RESOLVE_REPORT_BANNED",
} as const;

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "VIEW_REPORTS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const reportId = handler.context.params!.id;
  const body = (await readBody(handler).catch(() => null)) ?? {};
  const outcome = body.outcome as keyof typeof OUTCOMES | undefined;
  if (outcome !== undefined && !(outcome in OUTCOMES)) {
    throw createError({ status: 400, statusMessage: "Unknown outcome" });
  }

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

  await logModAction(
    me.id,
    outcome ? OUTCOMES[outcome] : "RESOLVE_REPORT",
    "report",
    reportId,
    modLogNote(body.note)
  );

  return { success: true };
});
