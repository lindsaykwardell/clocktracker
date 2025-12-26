import type { User } from "@supabase/supabase-js";
import { PrismaClient, Alignment, WinStatus_V2 } from "@prisma/client";
import { mapOfficialIdToClocktrackerId } from "~/server/utils/getRoleMap";
import { saveCustomScript, UploadedScript } from "~/server/utils/customScript";

const prisma = new PrismaClient();

type DigitalGrimoireGame = {
  date: Date;
  script_id?: number;
  script:
    | [
        {
          id: "_meta";
          name: string;
          author?: string;
          logo?: string;
          almanac?: string;
          background?: string;
        },
        ...(
          | {
              id: string;
              image?: string | string[];
              reminders?: string[];
              name: string;
              team?:
                | "townsfolk"
                | "outsider"
                | "minion"
                | "demon"
                | "traveler"
                | "fabled";
              ability?: string;
            }
          | string
        )[]
      ]
    | string;
  script_version?: string;
  player_count: number;
  traveler_count: number;
  win: "GOOD_WINS" | "EVIL_WINS" | "NOT_RECORDED";
  demon_bluffs: string[];
  fabled: string[];
  grimoire: {
    role_id: string;
    alignment: "GOOD" | "EVIL" | "NEUTRAL";
    is_dead: boolean;
    used_ghost_vote: boolean;
    order: number;
    created_at: Date;
    player_name: string;
    reminders: {
      role_id: string;
      reminder: string;
    }[];
  }[];
};

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

  const user: User | null = handler.context.user;

  if (!user) {
    // Rather than throw here, redirect to the login page
    return sendRedirect(handler, "/login");
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

  let body: DigitalGrimoireGame;
  try {
    // Strip surrounding quotes if present (sometimes form data double-encodes the string)
    let jsonString = gameString.trim();
    if (
      (jsonString.startsWith("'") && jsonString.endsWith("'")) ||
      (jsonString.startsWith('"') && jsonString.endsWith('"'))
    ) {
      jsonString = jsonString.slice(1, -1);
    }
    body = JSON.parse(jsonString) as DigitalGrimoireGame;
  } catch (e) {
    throw createError({
      status: 400,
      statusMessage: `Bad Request - invalid JSON in 'game' field: ${
        e instanceof Error ? e.message : "Unknown error"
      }`,
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Handle script - either find existing or create custom
  let scriptId: number | null = null;
  let scriptName = "";

  if (typeof body.script === "string") {
    // Script is a name, try to find it
    scriptName = body.script;

    if (body.script_id) {
      scriptId = body.script_id;
    } else {
      const existingScript = await prisma.script.findFirst({
        where: {
          name: {
            equals: body.script,
            mode: "insensitive",
          },
          is_custom_script: false,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (existingScript) {
        scriptId = existingScript.id;
      }
    }
  } else if (Array.isArray(body.script) && body.script.length > 0) {
    // Script is a custom script array, save it
    const meta = body.script[0];
    scriptName = meta.name;

    const savedScript = await saveCustomScript(
      body.script as UploadedScript,
      user
    );
    scriptId = savedScript.id;
  }

  // Map role IDs for grimoire tokens
  const mappedGrimoire = await Promise.all(
    body.grimoire.map(async (token) => {
      const role_id = await mapOfficialIdToClocktrackerId(token.role_id);

      const mappedReminders = await Promise.all(
        token.reminders.map(async (reminder) => {
          const reminderRole = await prisma.role.findUnique({
            where: { id: reminder.role_id },
            select: { token_url: true },
          });

          return {
            reminder: reminder.reminder,
            token_url: reminderRole?.token_url || "",
          };
        })
      );

      return {
        role_id: role_id || null,
        alignment: token.alignment as Alignment,
        is_dead: token.is_dead,
        used_ghost_vote: token.used_ghost_vote,
        order: token.order,
        player_name: token.player_name,
        reminders: mappedReminders,
      };
    })
  );

  // Map demon bluffs
  const mappedDemonBluffs = await Promise.all(
    body.demon_bluffs.map(async (bluff) => {
      const role_id = await mapOfficialIdToClocktrackerId(bluff);
      const role = role_id
        ? await prisma.role.findUnique({
            where: { id: role_id },
            select: { name: true },
          })
        : null;

      return {
        name: role?.name || bluff,
        role_id: role_id || null,
      };
    })
  );

  // Map fabled
  const mappedFabled = await Promise.all(
    body.fabled.map(async (fab) => {
      const role_id = await mapOfficialIdToClocktrackerId(fab);
      const role = role_id
        ? await prisma.role.findUnique({
            where: { id: role_id },
            select: { name: true },
          })
        : null;

      return {
        name: role?.name || fab,
        role_id: role_id || null,
      };
    })
  );

  // Map win status
  const win_v2 = body.win as WinStatus_V2;

  // Create the game with waiting_for_confirmation set to true
  const newGame = await prisma.game.create({
    data: {
      user_id: user.id,
      date: new Date(body.date),
      script: scriptName,
      script_id: scriptId,
      location_type: "ONLINE",
      location: "",
      player_count: body.player_count,
      traveler_count: body.traveler_count,
      win_v2,
      notes: "",
      is_storyteller: true,
      waiting_for_confirmation: true,
      demon_bluffs: {
        create: mappedDemonBluffs,
      },
      fabled: {
        create: mappedFabled,
      },
      grimoire: {
        create: [
          {
            tokens: {
              create: mappedGrimoire.map((token, index) => ({
                role_id: token.role_id,
                alignment: token.alignment,
                is_dead: token.is_dead,
                used_ghost_vote: token.used_ghost_vote,
                order: token.order ?? index,
                player_name: token.player_name,
                reminders: {
                  create: token.reminders,
                },
              })),
            },
          },
        ],
      },
    },
  });

  // Redirect to the game editor
  return sendRedirect(handler, `/game/${newGame.id}/edit`);
});
