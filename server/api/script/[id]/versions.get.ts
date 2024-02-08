import { PrismaClient } from "@prisma/client";
import { getScriptVersions } from "~/server/utils/getScriptVersions";

const prisma = new PrismaClient();

// This endpoint is specifically for fetching a script by its ID
// This is the ClockTracker ID, not the BOTC script db ID.
export default defineEventHandler(async (handler) => {
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

  return getScriptVersions(script);
});
