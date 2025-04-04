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

  const existing_campaign = await prisma.lSCampaign.findUnique({
    where: {
      id: view_code,
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

  if (existing_campaign) {
    // Check if each game already has a script
    for (const game of existing_campaign.games) {
      if (!game.script_id) {
        const script = await getLSGameJson(game.id);
        script[0].name = existing_campaign.title;
        try {
          const uploadedScript = await saveCustomScript(script, user!);
          if (uploadedScript) {
            await prisma.lSGame.update({
              where: {
                id: game.id,
              },
              data: {
                script_id: uploadedScript.id,
              },
            });
          }
        } catch (e) {
          console.log("Error saving script for game", game.id);
          console.error(e);
        }
      }
    }

    // If we already have all the games, return the campaign
    if (existing_campaign.games.length === campaign.maxGameNum) {
      return existing_campaign;
    }

    // Get only the new games
    const lastGameNum =
      existing_campaign.games[existing_campaign.games.length - 1].game_number;

    for (let index = lastGameNum; index < campaign.maxGameNum; index++) {
      const game = await getLSGameInfo(view_code, index);

      if (!game) {
        continue;
      }

      const characters: (string | undefined)[] = await Promise.all(
        JSON.parse(game.characters).map(mapOfficialIdToClocktrackerId)
      );
      const deaths: (string | undefined)[] = await Promise.all(
        JSON.parse(game.deaths).map(mapOfficialIdToClocktrackerId)
      );
      const retire: (string | undefined)[] = await Promise.all(
        game.retire
          ? JSON.parse(game.retire).map(mapOfficialIdToClocktrackerId)
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
        const script = await getLSGameJson(game.game_id);
        script[0].name = existing_campaign.title;
        const uploadedScript = await saveCustomScript(script, user);
        if (uploadedScript) {
          script_id = uploadedScript.id;
        }
      }

      await prisma.lSGame.create({
        data: {
          id: game.game_id,
          game_number: game.gameNum,
          characters: {
            connect: characters.map((id) => ({
              id,
            })),
          },
          deaths: {
            connect: deaths.map((id) => ({
              id,
            })),
          },
          retire: {
            connect: retire.map((id) => ({
              id,
            })),
          },
          created: new Date(game.created),
          submitted: game.submitted ? new Date(game.submitted) : null,
          win,
          notes: game.notes ?? undefined,
          ls_campaign_id: view_code,
          script_id: script_id,
        },
      });
    }

    return prisma.lSCampaign.findUnique({
      where: {
        id: view_code,
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
  } else {
    const games = await getAllLSGameInfo(view_code);
    const reserved_characters = [];
    for (const character of campaign.campaign_options.reserved_characters) {
      reserved_characters.push(await mapOfficialIdToClocktrackerId(character));
    }

    const game_data = [];

    for (const game of games) {
      console.log("Game", game);
      const characters: (string | undefined)[] = await Promise.all(
        JSON.parse(game.characters).map(mapOfficialIdToClocktrackerId)
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
        const script = await getLSGameJson(game.game_id);
        script[0].name = campaign.title;
        const uploadedScript = await saveCustomScript(script, user);
        if (uploadedScript) {
          script_id = uploadedScript.id;
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

    return prisma.lSCampaign.create({
      data: {
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
  }
});
