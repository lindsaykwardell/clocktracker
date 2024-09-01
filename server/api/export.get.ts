import type { User } from "@supabase/supabase-js";
import {
  Alignment,
  Character,
  LocationType,
  PrismaClient,
  Role,
  WinStatus_V2,
} from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

type ExportedRow = {
  date: string;
  script: string;
  storyteller: string;
  location_type: string;
  location: string;
  community: string;
  player_count: string;
  traveler_count: string;
  win: string;
  starting_role: string;
  starting_related_role: string;
  starting_alignment: string;
  ending_role: string;
  ending_related_role: string;
  ending_alignment: string;
  notes: string;
};

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const games = await fetchGames(user.id, user);

  setResponseHeader(
    handler,
    "content-disposition",
    `attachment; filename=${`ClockTracker Export - ${dayjs().format(
      "YYYY-MM-DD"
    )}.csv`}`
  );

  return games.reduce(
    (csv, game) => {
      const [starting_role, starting_related_role, starting_alignment]: [
        string,
        string,
        Alignment | ""
      ] = (() => {
        if (game.is_storyteller) return ["", "", ""];

        return [
          game.player_characters[0]?.name,
          game.player_characters[0]?.related ?? "",
          game.player_characters[0]?.alignment ?? "",
        ];
      })();

      const [ending_role, ending_related_role, ending_alignment]: [
        string,
        string,
        Alignment | ""
      ] = (() => {
        if (game.is_storyteller) return ["", "", ""];

        const role =
          game.player_characters[game.player_characters.length - 1]?.name ?? "";
        const related =
          game.player_characters[game.player_characters.length - 1]?.related ??
          "";
        const alignment =
          game.player_characters[game.player_characters.length - 1]
            ?.alignment ?? "";

        return [
          role === starting_role ? "" : role,
          related === starting_related_role ? "" : related,
          alignment === starting_alignment ? "" : alignment,
        ];
      })();

      const win = (() => {
        if (game.is_storyteller) {
          if (game.win_v2 === WinStatus_V2.GOOD_WINS) return "WIN";
          if (game.win_v2 === WinStatus_V2.EVIL_WINS) return "LOSS";
          return "";
        } else {
          if (game.win_v2 === WinStatus_V2.GOOD_WINS) {
            return starting_alignment === Alignment.GOOD ? "WIN" : "LOSS";
          } else if (game.win_v2 === WinStatus_V2.EVIL_WINS) {
            return starting_alignment === Alignment.EVIL ? "WIN" : "LOSS";
          } else {
            return "";
          }
        }
      })();

      const row: ExportedRow = {
        date: dayjs(game.date).format("YYYY-MM-DD"),
        script: game.script,
        storyteller: game.is_storyteller ? "Me" : game.storyteller ?? "",
        location_type: game.location_type,
        location: game.location,
        community: game.community_name,
        player_count: game.player_count?.toString() ?? "",
        traveler_count: game.traveler_count?.toString() ?? "",
        win,
        starting_role,
        starting_related_role,
        starting_alignment,
        ending_role,
        ending_related_role,
        ending_alignment,
        notes: game.notes,
      };

      csv += Object.values(row).join(",") + "\n";

      return csv;
    },
    `Date,Script,"Storyteller (say ""me"" if it was you)",Online/In Person,Location (if in person),Community,Player count,Traveler count,Game Result (win/loss),Starting Role,Starting Related Role,Starting Alignment (if not default),Ending Role (if different),Ending Related Role,Ending Alignment (if not default),Notes
`
  );
});
