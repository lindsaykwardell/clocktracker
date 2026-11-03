import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import {
  LocationType,
  WinStatus_V2,
  PrivacySetting,
  type GameEndTrigger,
} from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";
import {
  getTaggedPlayerIds,
  buildPlayerCharactersForToken,
} from "~/server/utils/gamePropagation";
import { findOrCreatePlayerChildGame,findOrCreateStorytellerChildGame } from "~/server/utils/childGame";

export default defineEventHandler(async (handler) => {
  const user: User|null=handler.context.user;
  const body=await readBody<{
    game_ids: string[];
    script: string;
    script_id: number|null;
    storyteller: string;
    co_storytellers: string[];
    is_storyteller: boolean;
    location_type: LocationType|undefined;
    location: string;
    community_name: string;
    community_id: number|null;
    player_count: number|null;
    traveler_count: number|null;
    win_v2: WinStatus_V2|undefined;
    end_trigger: GameEndTrigger|undefined;
    end_trigger_role_id: string|null|undefined;
    end_trigger_note: string|undefined;
    end_trigger_participant_id: string|null|undefined;
    tags: string[];
    privacy: PrivacySetting|"";
  }|null>(handler);

  if(!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if(!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const games=await prisma.game.findMany({
    where: {
      id: {
        in: body.game_ids,
      },
      user_id: user.id,
    },
  });

  await prisma.$transaction(async (tx) => {
    for(const payload of games) {
      const game=await tx.game.update({
        where: {
          id: payload.id,
        },
        data: {
          script: body.script||payload.script,
          script_id: body.script_id||payload.script_id,
          storyteller: body.storyteller||payload.storyteller,
          co_storytellers:
            body.co_storytellers.length>0
              ? body.co_storytellers
              :payload.co_storytellers,
          is_storyteller: body.is_storyteller||payload.is_storyteller,
          location_type: body.location_type||payload.location_type,
          location: body.location||payload.location,
          community_name: body.community_name||payload.community_name,
          community_id: body.community_id||payload.community_id,
          player_count: body.player_count||payload.player_count,
          traveler_count: body.traveler_count||payload.traveler_count,
          win_v2: body.win_v2||payload.win_v2,
          end_trigger: body.end_trigger||payload.end_trigger,
          end_trigger_role_id:
            body.end_trigger_role_id===undefined
              ? payload.end_trigger_role_id
              :body.end_trigger_role_id,
          end_trigger_note:
            body.end_trigger_note===undefined
              ? payload.end_trigger_note
              :body.end_trigger_note,
          end_trigger_participant_id:
            body.end_trigger_participant_id===undefined
              ? payload.end_trigger_participant_id
              :body.end_trigger_participant_id,
          tags: [...payload.tags,...body.tags],
          privacy: body.privacy||payload.privacy,
        },
        include: {
          player_characters: true,
          demon_bluffs: true,
          fabled: true,
          end_trigger_role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
              name: true,
            },
          },
          grimoire: {
            include: {
              tokens: {
                include: {
                  role: true,
                  related_role: true,
                  reminders: true,
                  player: {
                    select: {
                      username: true,
                      display_name: true,
                    },
                  },
                },
              },
            },
          },
          child_games: {
            include: {
              demon_bluffs: true,
              fabled: true,
              player_characters: true,
            },
          },
          parent_game: {
            include: {
              player_characters: true,
              demon_bluffs: true,
              fabled: true,
              child_games: {
                include: {
                  player_characters: true,
                  demon_bluffs: true,
                  fabled: true,
                },
              },
            },
          },
          community: {
            select: {
              slug: true,
              icon: true,
            },
          },
          associated_script: {
            select: {
              version: true,
              script_id: true,
              is_custom_script: true,
              logo: true,
            },
          },
        },
      });

      console.log({
        storyteller: game.storyteller,
        co_storytellers: game.co_storytellers,
        is_storyteller: game.is_storyteller,
        location_type: game.location_type,
        location: game.location,
        community_name: game.community_name,
        community_id: game.community_id,
        player_count: game.player_count,
        traveler_count: game.traveler_count,
        win_v2: game.win_v2,
        end_trigger: game.end_trigger,
        end_trigger_role_id: game.end_trigger_role_id,
        end_trigger_note: game.end_trigger_note,
        end_trigger_participant_id: game.end_trigger_participant_id,
        tags: game.tags,
        privacy: game.privacy,
      });

      const related_games=[...game.child_games];

      if(game.parent_game) {
        related_games.push(game.parent_game);
        related_games.push(...game.parent_game.child_games);
      }

      const taggedPlayers=getTaggedPlayerIds(game.grimoire,user.id);

      for(const id of taggedPlayers) {
        const player_characters=buildPlayerCharactersForToken(
          game.grimoire,
          id,
        );

        try {
          await findOrCreatePlayerChildGame({
            db: tx,
            game,
            playerId: id,
            playerCharacters: player_characters,
            relatedGames: related_games,
          });
        } catch(err: any) {
          const taggedPlayer=
            game.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id===id)
              ?.player_name||"Unknown";
          console.error(`Error creating child game for ${taggedPlayer}: ${err.message}`);
          throw err;
        }
      }

      const storytellers=[game.storyteller,...game.co_storytellers];

      for(const storyteller of storytellers) {
        if(storyteller?.includes("@")) {
          // Verify that it's a friend
          const friend=await tx.userSettings.findUnique({
            where: {
              username: storyteller.replace("@",""),
              friends: {
                some: {
                  user_id: user.id,
                },
              },
            },
          });

          if(friend!==null) {
            try {
              await findOrCreateStorytellerChildGame({
                db: tx,
                game,
                storytellerUserId: friend.user_id,
                childGames: game.child_games,
              });
            } catch(err: any) {
              console.error(`Error creating storyteller child game for ${storyteller}: ${err.message}`);
              throw err;
            }
          }
        }
      }
    }
  });
});
