const {
  PrismaClient,
  Alignment,
  WinStatus,
  WinStatus_V2,
} = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : undefined;
const adapter = pool ? new PrismaPg(pool) : undefined;

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // Load all games
  const games = await prisma.game.findMany({
    select: {
      id: true,
      win: true,
      is_storyteller: true,
      player_characters: {
        select: {
          alignment: true,
        },
      },
    },
    where: {
      win: {
        not: WinStatus.NOT_RECORDED,
      },
      win_v2: WinStatus_V2.NOT_RECORDED,
    },
  });

  for (const index in games) {
    const game = games[index];
    console.log(`Game ${index} of ${games.length}`);
    const win_v2 = (() => {
      if (game.is_storyteller) {
        if (game.win === "WIN") {
          return "GOOD_WINS";
        } else if (game.win === "LOSS") {
          return "EVIL_WINS";
        } else {
          return "NOT_RECORDED";
        }
      } else {
        const { alignment } =
          game.player_characters.length > 0
            ? game.player_characters[game.player_characters.length - 1]
            : { alignment: Alignment.GOOD };

        if (alignment === "GOOD") {
          if (game.win === "WIN") {
            return "GOOD_WINS";
          } else if (game.win === "LOSS") {
            return "EVIL_WINS";
          } else {
            return "NOT_RECORDED";
          }
        } else if (alignment === "EVIL") {
          if (game.win === "WIN") {
            return "EVIL_WINS";
          } else if (game.win === "LOSS") {
            return "GOOD_WINS";
          } else {
            return "NOT_RECORDED";
          }
        } else {
          return "NOT_RECORDED";
        }
      }
    })();

    await prisma.game.update({
      where: {
        id: game.id,
      },
      data: {
        win_v2,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
