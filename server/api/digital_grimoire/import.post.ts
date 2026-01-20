import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const allowedOrigins = [
    "https://botc.games/",
    "https://staging.botc.games/",
    "https://botc.games",
    "https://staging.botc.games",
  ];

  const origin = getRequestHeader(handler, "origin");

  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeaders(handler, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    });
  }

  if (getMethod(handler) === "OPTIONS") {
    return "";
  }

  // Parse form data - the game data comes as a stringified JSON in a field called "game"
  const formData = await readFormData(handler);
  const gameString = formData.get("game");

  if (!gameString || typeof gameString !== "string") {
    throw createError({
      status: 400,
      statusMessage: "Bad Request - missing 'game' field in form data",
    });
  }

  // Strip surrounding quotes if present (sometimes form data double-encodes the string)
  let jsonString = gameString.trim();
  if (
    (jsonString.startsWith("'") && jsonString.endsWith("'")) ||
    (jsonString.startsWith('"') && jsonString.endsWith('"'))
  ) {
    jsonString = jsonString.slice(1, -1);
  }

  const importedGame = await prisma.importedGame.create({
    data: {
      payload: jsonString,
    },
  });

  // Redirect to the game editor
  return sendRedirect(handler, `/add-game?imported_game=${importedGame.id}`);
});
