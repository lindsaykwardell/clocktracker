import type { User } from "@supabase/supabase-js";

type DigitalGrimoireGame = {
    date: Date
    script_id?: number;
    script: [
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
    ] | string;
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
            reminder: string
        }[],
    }[]
}

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<DigitalGrimoireGame>(handler)

  if (!user) {
    // Rather than throw here, redirect to the login page
    sendRedirect(handler, "/")
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request"
    })
  }

  return body
})