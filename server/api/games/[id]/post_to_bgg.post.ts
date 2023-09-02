import type { User } from "@supabase/supabase-js";
import { Alignment, PrismaClient, PrivacySetting } from "@prisma/client";
import axios from "axios";
// @ts-ignore
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user = handler.context.user as User | null;
  const gameId = handler.context.params?.id as string;
  const body = await readBody<{ anonymize: boolean }>(handler);

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

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      user_id: user.id,
    },
    select: {
      display_name: true,
      bgg_cookies: true,
      bgg_username: true,
      privacy: true,
    },
  });

  if (!userSettings?.bgg_cookies || !userSettings?.bgg_username) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: user.id,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const storyteller = game.storyteller?.startsWith("@")
    ? (await prisma.userSettings
        .findUnique({
          where: {
            username: game.storyteller.slice(1),
          },
          select: {
            display_name: true,
          },
        })
        .then((u) => u?.display_name)) ?? game.storyteller
    : game.storyteller;

  let location = game.location || game.location_type;
  const players: {
    username: string | null;
    name: string;
    win: boolean;
    color: string;
  }[] = [];

  if (storyteller) {
    players.push({
      username: null,
      name: storyteller,
      win: false,
      color: "Storyteller",
    });
  } else if (game.is_storyteller) {
    players.push({
      username: userSettings.bgg_username,
      name: userSettings.display_name,
      win: false,
      color: "Storyteller",
    });
  }

  const parentGameLastAlignment =
    game.player_characters[game.player_characters.length - 1]?.alignment ||
    Alignment.NEUTRAL;

  for (const token of game.grimoire.flatMap((g) => g.tokens || [])) {
    if (token.player_name) {
      players.push({
        username: null,
        name: token.player_name,
        win: (() => {
          if (parentGameLastAlignment === Alignment.NEUTRAL) {
            if (token.alignment === Alignment.GOOD) {
              return game.win;
            } else {
              return !game.win;
            }
          }

          if (token.alignment === parentGameLastAlignment) {
            return game.win;
          } else {
            return !game.win;
          }
        })(),
        color:
          token.alignment === Alignment.GOOD
            ? "Good - " + token.role?.name
            : token.alignment === Alignment.EVIL
            ? "Evil -" + token.role?.name
            : "",
      });
    }
  }

  if (body.anonymize) {
    // Reduce the player name to the first letter of their name
    for (const player of players) {
      player.name = player.name.replace("@", "")[0] + ".";
    }
  }

  const playResponse = await axios.post<{
    playid: string;
  }>(
    "https://boardgamegeek.com/geekplay.php",
    {
      playdate: dayjs(game.date).format("YYYY-MM-DD"),
      comments: `${game.script}

${game.notes}
`,
      length: 60,
      twitter: "false",
      minutes: 60,
      location: body.anonymize ? location[0] + "." : location,
      objectid: "240980",
      hours: 0,
      quantity: "1",
      action: "save",
      date: game.date.toISOString(),
      players,
      objecttype: "thing",
      ajax: 1,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: userSettings.bgg_cookies,
      },
    }
  );

  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      bgg_id: +playResponse.data.playid,
    },
  });

  // update the cookies
  const cookies = [
    playResponse.headers["set-cookie"]?.[0],
    playResponse.headers["set-cookie"]?.[1],
  ].filter((c) => !!c) as string[];

  if (cookies[0] && cookies[1]) {
    await prisma.userSettings.update({
      where: {
        user_id: user.id,
      },
      data: {
        bgg_cookies: cookies,
      },
    });
  }

  return true;
});
