import type { User } from "@supabase/supabase-js";
import {
  Alignment,
  PrismaClient,
  PrivacySetting,
  WinStatus_V2,
} from "@prisma/client";
import axios from "axios";
// @ts-ignore
import dayjs from "dayjs";
import { fetchGame } from "~/server/utils/fetchGames";
import { useFeatureFlags } from "~/server/utils/featureFlags";

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

  const game = await fetchGame(gameId, user, true);

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
  for (const token of game.grimoire[game.grimoire.length - 1].tokens) {
    if (token.player_name) {
      players.push({
        username: null,
        name: token.player_name,
        win: await (async () => {
          return token.alignment === Alignment.GOOD
            ? game.win_v2 === WinStatus_V2.GOOD_WINS
            : game.win_v2 === WinStatus_V2.EVIL_WINS;
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

  // Remove @ sign
  for (const player of players) {
    player.name = player.name.replace("@", "");
  }

  // Anonymize the players if the user has that setting enabled
  if (body.anonymize) {
    // Reduce the player name to the first letter of their name
    for (const player of players) {
      player.name = player.name[0] + ".";
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
