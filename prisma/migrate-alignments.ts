import { PrismaClient, Alignment } from "@prisma/client";
const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

function pushEntry(arr, token) {
  const last = arr[arr.length - 1];
  if (
    last &&
    last.role_id === token.role_id &&
    last.related_role_id === token.related_role_id &&
    last.alignment === token.alignment
  ) return;
  arr.push({
    name: token.role?.name ?? "",
    alignment: token.alignment as Alignment,
    related: token.related_role?.name ?? "",
    role_id: token.role_id,
    related_role_id: token.related_role_id,
  });
}

async function rebuildGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      grimoire: {
        orderBy: { id: "asc" },
        include: {
          tokens: {
            orderBy: { order: "asc" },
            include: { role: true, related_role: true },
          },
        },
      },
      player_characters: true,
    },
  });
  if (!game) return;

  const timelines = new Map<string, any[]>();
  for (const page of game.grimoire) {
    for (const token of page.tokens) {
      const key = token.player_id ?? token.player_name ?? "";
      if (!key) continue;
      const arr = timelines.get(key) ?? [];
      pushEntry(arr, token);
      timelines.set(key, arr);
    }
  }

  const myTimeline = timelines.get(game.user_id) ?? [];
  if (!myTimeline.length) return;

  if (DRY_RUN) {
    console.log(`Would update game ${game.id}: ${game.player_characters.length} -> ${myTimeline.length}`);
    return;
  }

  await prisma.$transaction([
    prisma.character.deleteMany({
      where: { game_id: game.id },
    }),
    prisma.character.createMany({
      data: myTimeline.map((c, idx) => ({
        ...c,
        game_id: game.id,
      })),
    }),
  ]);
}

async function main() {
  const games = await prisma.game.findMany({ select: { id: true } });
  for (const g of games) {
    await rebuildGame(g.id);
  }
}
main().finally(() => prisma.$disconnect());
