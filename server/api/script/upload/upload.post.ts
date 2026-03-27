import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { type UploadedScript, saveCustomScript } from "~/server/utils/customScript";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  const body = await readBody<UploadedScript>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  return saveCustomScript(body, user);
});
