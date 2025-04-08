import { PrismaClient, WinStatus_V2 } from "@prisma/client";
import { mapOfficialIdToClocktrackerId } from "~/server/utils/getRoleMap";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user = handler.context.user as User | null;
  const view_code = handler.context.params!.view_code;

  const campaign = await getLSCampaign(view_code);

  if (campaign.error) {
    return null;
  }

  const games = await getAllLSGameInfo(view_code);
  const reserved_characters = [];
  for (const character of campaign.campaign_options.reserved_characters) {
    reserved_characters.push(await mapOfficialIdToClocktrackerId(character));
  }

  const game_data = [];

  for (const game of games) {
    const characters: (string | undefined)[] = await Promise.all(
      JSON.parse(game.characters ?? "[]").map(mapOfficialIdToClocktrackerId)
    );
    const deaths: (string | undefined)[] = await Promise.all(
      JSON.parse(game.deaths ?? "[]").map(mapOfficialIdToClocktrackerId)
    );
    const retire: (string | undefined)[] = await Promise.all(
      game.retire
        ? JSON.parse(game.retire ?? "[]").map(mapOfficialIdToClocktrackerId)
        : []
    );
    const win =
      game.goodWon === 1
        ? WinStatus_V2.GOOD_WINS
        : game.goodWon === 0
        ? WinStatus_V2.EVIL_WINS
        : WinStatus_V2.NOT_RECORDED;

    let script_id: number | undefined = undefined;
    if (user) {
      const existing_script = await prisma.script.findFirst({
        where: {
          ls_game: {
            id: game.game_id,
          },
        },
      });
      if (existing_script) {
        script_id = existing_script.id;
      } else {
        const script = await getLSGameJson(game.game_id);
        script[0].name = campaign.title;
        const uploadedScript = await saveCustomScript(script, user);
        if (uploadedScript) {
          script_id = uploadedScript.id;
        }
      }
    }

    game_data.push({
      id: game.game_id,
      game_number: game.gameNum,
      characters,
      deaths,
      retire,
      created: new Date(game.created),
      submitted: game.submitted ? new Date(game.submitted) : null,
      win,
      notes: game.notes ?? undefined,
      script_id,
    });
  }

  return prisma.lSCampaign.upsert({
    where: {
      id: view_code,
    },
    create: {
      id: view_code,
      title: campaign.title,
      author: campaign.author,
      end_condition: campaign.campaign_options.end_condition,
      end_value: campaign.campaign_options.end_value,
      max_townsfolk: campaign.campaign_options.max_townsfolk,
      max_outsiders: campaign.campaign_options.max_outsider,
      max_minions: campaign.campaign_options.max_minion,
      max_demons: campaign.campaign_options.max_demon,
      script_growth_speed: campaign.campaign_options.script_growth_speed,
      script_truncate_speed: campaign.campaign_options.script_truncate_speed,
      like_surprises: campaign.campaign_options.like_surprises === 1,
      reserved_characters: {
        connect: reserved_characters.map((id) => ({
          id,
        })),
      },
      games: {
        create: game_data.map((game) => ({
          ...game,
          characters: {
            connect: game.characters.map((id) => ({
              id,
            })),
          },
          deaths: {
            connect: game.deaths.map((id) => ({
              id,
            })),
          },
          retire: {
            connect: game.retire.map((id) => ({
              id,
            })),
          },
        })),
      },
    },
    update: {
      id: view_code,
      title: campaign.title,
      author: campaign.author,
      end_condition: campaign.campaign_options.end_condition,
      end_value: campaign.campaign_options.end_value,
      max_townsfolk: campaign.campaign_options.max_townsfolk,
      max_outsiders: campaign.campaign_options.max_outsider,
      max_minions: campaign.campaign_options.max_minion,
      max_demons: campaign.campaign_options.max_demon,
      script_growth_speed: campaign.campaign_options.script_growth_speed,
      script_truncate_speed: campaign.campaign_options.script_truncate_speed,
      like_surprises: campaign.campaign_options.like_surprises === 1,
      reserved_characters: {
        connect: reserved_characters.map((id) => ({
          id,
        })),
      },
      games: {
        upsert: game_data.map((game) => ({
          where: { id: game.id },
          update: {
            game_number: game.game_number,
            characters: {
              connect: game.characters.filter(Boolean).map((id) => ({ id })),
            },
            deaths: {
              connect: game.deaths.filter(Boolean).map((id) => ({ id })),
            },
            retire: {
              connect: game.retire.filter(Boolean).map((id) => ({ id })),
            },
            created: game.created,
            submitted: game.submitted,
            win: game.win,
            notes: game.notes,
          },
          create: {
            id: game.id,
            game_number: game.game_number,
            characters: {
              connect: game.characters.filter(Boolean).map((id) => ({ id })),
            },
            deaths: {
              connect: game.deaths.filter(Boolean).map((id) => ({ id })),
            },
            retire: {
              connect: game.retire.filter(Boolean).map((id) => ({ id })),
            },
            created: game.created,
            submitted: game.submitted,
            win: game.win,
            notes: game.notes,
          },
        })),
      },
    },
    include: {
      games: {
        include: {
          script: {
            include: {
              roles: {
                include: {
                  reminders: true,
                },
              },
            },
          },
        },
      },
    },
  });
});
