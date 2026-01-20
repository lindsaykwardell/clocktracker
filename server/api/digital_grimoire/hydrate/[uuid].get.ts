import type { User } from "@supabase/supabase-js";
import { Alignment, WinStatus_V2 } from "@prisma/client";
import { mapOfficialIdToClocktrackerId } from "~/server/utils/getRoleMap";
import { saveCustomScript, UploadedScript } from "~/server/utils/customScript";
import { prisma } from "~/server/utils/prisma";

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
  const imported_game_uuid = handler.context.params!.uuid;

  const user: User | null = handler.context.user;

  if (!user) {
    // Rather than throw here, redirect to the login page
    return sendRedirect(handler, "/login");
  }

  let body: DigitalGrimoireGame;
  try {
    const importedGame = await prisma.importedGame.findFirst({
      where: {
        id: imported_game_uuid,
      },
    });

    body = JSON.parse(importedGame!.payload) as DigitalGrimoireGame;
  } catch (e) {
    throw createError({
      status: 400,
      statusMessage: `Bad Request - game doesn't exist or invalid JSON : ${
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

  const hydratedGame = {
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
    demon_bluffs: mappedDemonBluffs,
    fabled: mappedFabled,
    grimoire: [
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
  };

  // delete the payload

  await prisma.importedGame.delete({
    where: {
      id: imported_game_uuid,
    },
  });

  return hydratedGame;
});
