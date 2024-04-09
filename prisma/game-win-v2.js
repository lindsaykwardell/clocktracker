const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
  });

  for (const game of games) {
    console.log(game);
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
          game.player_characters[game.player_characters.length - 1];

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

    console.log(win_v2);

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
