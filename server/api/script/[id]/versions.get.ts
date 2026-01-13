import { User } from "@supabase/supabase-js";
import { getScriptVersions } from "~/server/utils/getScriptVersions";
import { prisma } from "~/server/utils/prisma";

// This endpoint is specifically for fetching a script by its ID
// This is the ClockTracker ID, not the BOTC script db ID.
export default defineEventHandler(async (handler) => {
  const me = handler.context.user as User | null;
  const id = handler.context.params?.id as string;

  const script = await prisma.script.findUnique({
    where: {
      id: +id,
    },
  });

  if (!script) {
    console.error(`Script not found: ${id}`);
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return getScriptVersions(script, me);
});
