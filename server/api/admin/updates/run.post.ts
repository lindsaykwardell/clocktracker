import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { hasPermission } from "~/server/utils/permissions";
import { runAppUpdate } from "~/server/updates/runner";

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    id: string;
    dryRun?: boolean;
    batchSize?: number;
    limit?: number;
    force?: boolean;
  }>(event);

  if (!body?.id) {
    throw createError({
      status: 400,
      statusMessage: "Missing update id",
    });
  }

  try {
    return await runAppUpdate(body.id, {
      dryRun: body.dryRun,
      batchSize: body.batchSize,
      limit: body.limit,
      force: body.force,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Unknown update:")) {
      throw createError({
        status: 404,
        statusMessage: message,
      });
    }

    throw createError({
      status: 500,
      statusMessage: message,
      data: (error as Error & { data?: unknown }).data,
    });
  }
});
