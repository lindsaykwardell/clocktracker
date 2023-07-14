import type { User } from "@supabase/supabase-js";
import { PrismaClient, UserSettings } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<string>(handler);

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

  // parse body as CSV
  const csv = body.split("\n").map((line) => {
    return line.split(",");
  });

  const scripts = csv
    .map((line) => {
      return {
        id: parseInt(line[0]),
        name: line[1],
        version: line[2],
        author: line[3],
        type: line[4],
        json_url: line[5],
        pdf_url: line[6],
      };
    })
    .filter((script) => !isNaN(script.id));

  const prisma = new PrismaClient();

  await prisma.script.deleteMany({});
  const saved = await prisma.script
    .createMany({
      data: scripts,
      skipDuplicates: true,
    })
    .catch((err) => console.error(err));

  return saved;
});
