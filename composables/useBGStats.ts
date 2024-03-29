import UAParser from "ua-parser-js";
import { WinStatus } from "./useGames";
import type { GameRecord } from "./useGames";
import dayjs from "dayjs";
import type { FetchStatus } from "./useFetchStatus";

export const useBGStats = (g: ComputedRef<FetchStatus<GameRecord>>) => {
  const user = useSupabaseUser();
  const users = useUsers();

  const canPostToBGStats = computed(() => {
    const me = users.getUserById(user.value?.id || "");

    if (me.status !== Status.SUCCESS) return false;

    const parser = new UAParser(navigator.userAgent);

    return (
      me.data.enable_bgstats &&
      ["mobile", "tablet"].includes(parser.getDevice().type!)
    );
  });

  function formatGame(game: GameRecord) {
    const useGrimoire =
      game.grimoire[0] && game.grimoire[0].tokens.some((token) => token.role);

    const parentGameLastAlignment =
      game.player_characters[game.player_characters.length - 1]?.alignment ||
      "NEUTRAL";

    const data = {
      sourceName: "ClockTracker",
      sourcePlayId: game.id,
      location: game.location || game.location_type,
      comments: game.notes,
      game: {
        bggId: 240980,
        highestWins: false,
        name: "Blood on the Clocktower",
        noPoints: true,
        sourceGameid: 240980,
      },
      board: game.script,
      playDate: dayjs(game.date).format("YYYY-MM-DD HH:mm:ss"),
      players: (useGrimoire
        ? [
            ...game.grimoire[game.grimoire.length - 1].tokens
              .filter((token) => token.player_name)
              .map((token) => ({
                name: token.player_name.replace("@", ""),
                role: `${token.alignment} - ${token.role?.name}`,
                sourcePlayerId: token.player_name,
                winner: (() => {
                  if (parentGameLastAlignment === "NEUTRAL") {
                    if (token.alignment === "GOOD") {
                      return game.win === WinStatus.WIN;
                    } else {
                      return game.win === WinStatus.LOSS;
                    }
                  }

                  if (token.alignment === parentGameLastAlignment) {
                    return game.win === WinStatus.WIN;
                  } else {
                    return game.win === WinStatus.LOSS;
                  }
                })(),
              })),
            game.is_storyteller || game.storyteller?.length
              ? {
                  name: game.is_storyteller
                    ? game.user.username
                    : game.storyteller?.replace("@", "") || "",
                  role: "Storyteller",
                  sourcePlayerId: game.is_storyteller
                    ? game.user.username
                    : game.storyteller?.replace("@", "") || "",
                  winner: true,
                }
              : undefined,
          ]
        : [
            {
              name: game.user.username,
              role: game.is_storyteller
                ? "Storyteller"
                : `${
                    game.player_characters[game.player_characters.length - 1]
                      .alignment
                  } - ${
                    game.player_characters[game.player_characters.length - 1]
                      .name
                  }`,
              sourcePlayerId: game.user.username,
              winner: game.win === WinStatus.WIN,
            },
          ]
      ).filter((p) => !!p),
    };

    return data;
  }

  const link = computed(() => {
    if (g.value.status !== Status.SUCCESS) return "#";

    return `bgstats://app.bgstatsapp.com/createPlay.html?data=${encodeURIComponent(
      JSON.stringify(formatGame(g.value.data))
    )}`;
  });

  return {
    canPostToBGStats,
    link,
  };
};
