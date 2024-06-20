import type { User } from "@supabase/supabase-js";
import {
  Alignment,
  Character,
  LocationType,
  PrismaClient,
  Role,
  WinStatus_V2,
} from "@prisma/client";
import papaparse from "papaparse";

const prisma = new PrismaClient();

type UploadedRow = {
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
  const body = await readBody<{
    csv: string;
  }>(handler);

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

  const result = await new Promise<UploadedRow[]>((resolve, reject) => {
    papaparse.parse(body.csv, {
      header: true,
      transformHeader: (header) => {
        switch (header) {
          case "Date":
            return "date";
          case "Script":
            return "script";
          case 'Storyteller (say "me" if it was you)':
            return "storyteller";
          case "Online/In Person":
            return "location_type";
          case "Location (if in person)":
            return "location";
          case "Community":
            return "community";
          case "Player count":
            return "player_count";
          case "Traveler count":
            return "traveler_count";
          case "Game Result (win/loss)":
            return "win";
          case "Starting Role":
            return "starting_role";
          case "Starting Related Role":
            return "starting_related_role";
          case "Starting Alignment (if not default)":
            return "starting_alignment";
          case "Ending Role (if different)":
            return "ending_role";
          case "Ending Related Role":
            return "ending_related_role";
          case "Ending Alignment (if not default)":
            return "ending_alignment";
          case "Notes":
            return "notes";
          default:
            return header;
        }
      },
      complete: (result) => {
        resolve(result.data as UploadedRow[]);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });

  for (const row of result) {
    let is_storyteller = false;
    let script_id = null;
    let location_type: LocationType = LocationType.ONLINE;
    let player_count: number | null = null;
    let traveler_count: number | null = null;
    let win: "WIN" | "LOSS" | "NOT_RECORDED" = "NOT_RECORDED";
    const player_characters: Partial<Character>[] = [];
    let date = row.date ? new Date(row.date) : new Date();

    if (row.starting_role) {
      player_characters.push(
        await normalizePlayerCharacter(
          row.starting_role,
          row.starting_related_role,
          row.starting_alignment
        )
      );
    }

    if (row.ending_role) {
      const endCharacter = await normalizePlayerCharacter(
        row.ending_role,
        row.ending_related_role,
        row.ending_alignment
      );

      // If the ending character is different from the starting character, add it to the list
      if (
        !(
          endCharacter.name === player_characters[0]?.name &&
          endCharacter.related === player_characters[0]?.related &&
          endCharacter.alignment === player_characters[0]?.alignment
        )
      ) {
        player_characters.push(
          await normalizePlayerCharacter(
            row.ending_role,
            row.ending_related_role,
            row.ending_alignment
          )
        );
      }
    }

    if (row.storyteller?.toLowerCase() === "me") {
      row.storyteller = "";
      is_storyteller = true;
    }

    if (row.script?.toLowerCase() === "sects & violets") {
      row.script = "Sects and Violets";
    }

    const script = await prisma.script.findFirst({
      where: {
        name: {
          equals: row.script,
          mode: "insensitive",
        },
        OR: [
          {
            user_id: {
              equals: user.id,
            },
          },
          {
            user_id: {
              equals: null,
            },
          },
        ],
      },
      orderBy: [
        {
          version: "desc",
        },
      ],
    });

    if (script) {
      script_id = script.id;
      row.script = script.name;
    }

    if (row.location_type?.toLowerCase() === "in person") {
      location_type = LocationType.IN_PERSON;
    }

    player_count = parseInt(row.player_count, 10);
    traveler_count = parseInt(row.traveler_count, 10);
    if (isNaN(player_count)) {
      player_count = null;
    }
    if (isNaN(traveler_count)) {
      traveler_count = null;
    }

    if (["win", "won", "yes", "true"].includes(row.win?.toLowerCase())) {
      win = "WIN";
    } else if (
      ["loss", "lost", "no", "false"].includes(row.win?.toLowerCase())
    ) {
      win = "LOSS";
    }

    const win_v2 = (() => {
      if (is_storyteller) {
        if (win === "WIN") {
          return WinStatus_V2.GOOD_WINS;
        } else if (win === "LOSS") {
          return WinStatus_V2.EVIL_WINS;
        } else {
          return WinStatus_V2.NOT_RECORDED;
        }
      } else if (player_characters.length <= 0) {
        return WinStatus_V2.NOT_RECORDED;
      } else {
        const { alignment } = player_characters[player_characters.length - 1];

        if (alignment === Alignment.GOOD) {
          if (win === "WIN") {
            return WinStatus_V2.GOOD_WINS;
          } else if (win === "LOSS") {
            return WinStatus_V2.EVIL_WINS;
          } else {
            return WinStatus_V2.NOT_RECORDED;
          }
        } else if (alignment === Alignment.EVIL) {
          if (win === "WIN") {
            return WinStatus_V2.EVIL_WINS;
          } else if (win === "LOSS") {
            return WinStatus_V2.GOOD_WINS;
          } else {
            return WinStatus_V2.NOT_RECORDED;
          }
        } else {
          return WinStatus_V2.NOT_RECORDED;
        }
      }
    })();

    await prisma.game.create({
      data: {
        user_id: user.id,
        date,
        script: row.script,
        script_id,
        storyteller: row.storyteller,
        location_type,
        location: row.location ?? "",
        community_name: row.community,
        player_count,
        traveler_count,
        win_v2,
        notes: row.notes ?? "",
        is_storyteller,
        player_characters: {
          create: player_characters.map((character) => ({
            name: character.name!,
            role_id: character.role_id ?? null,
            related: character.related!,
            related_role_id: character.related_role_id ?? null,
            alignment: character.alignment ?? Alignment.NEUTRAL,
          })),
        },
      },
    });
  }

  return fetchGames(user.id, user);
});

async function normalizePlayerCharacter(
  role_input: string,
  related_input: string,
  alignment_input: string
): Promise<{
  name: string;
  role_id: string | null;
  related: string;
  related_role_id: string | null;
  alignment: Alignment;
}> {
  if (role_input?.toLowerCase() === "pit hag") {
    role_input = "Pit-Hag";
  }

  let role: Role | null = null;
  let related_role: Role | null = null;
  let alignment: Alignment = Alignment.NEUTRAL;

  role = await prisma.role.findFirst({
    where: {
      name: {
        equals: role_input,
        mode: "insensitive",
      },
    },
  });

  if (related_input) {
    related_role = await prisma.role.findFirst({
      where: {
        name: {
          equals: related_input,
          mode: "insensitive",
        },
      },
    });
  }

  if (alignment_input) {
    if (alignment_input.toLowerCase().trim() === "good") {
      alignment = Alignment.GOOD;
    } else if (alignment_input.toLowerCase().trim() === "evil") {
      alignment = Alignment.EVIL;
    }
  } else if (role) {
    alignment = role.initial_alignment;
  }

  return {
    name: role?.name || role_input,
    role_id: role?.id ?? null,
    related: related_role?.name || related_input,
    related_role_id: related_role?.id ?? null,
    alignment,
  };
}
