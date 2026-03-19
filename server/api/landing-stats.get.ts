import { prisma } from "~/server/utils/prisma";

let cache: { data: any; expiry: number } | null = null;

export default defineEventHandler(async () => {
  // Cache for 1 hour to avoid hammering the DB on every visitor
  if (cache && Date.now() < cache.expiry) {
    return cache.data;
  }

  const [players, games, scripts] = await Promise.all([
    prisma.userSettings.count({
      where: { finished_welcome: true },
    }),
    prisma.game.count({
      where: { parent_game_id: null },
    }),
    prisma.game.groupBy({
      by: ["script"],
      where: { parent_game_id: null },
    }),
  ]);

  const data = {
    players,
    games,
    scripts: scripts.length,
  };

  cache = { data, expiry: Date.now() + 60 * 60 * 1000 };

  return data;
});
