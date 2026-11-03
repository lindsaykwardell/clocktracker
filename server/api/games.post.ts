import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import {
  type Game,
  type Character,
  type Token,
  type Grimoire,
  Alignment,
  type DemonBluff,
  type Fabled,
  type GrimoireEvent,
  type ReminderToken,
} from "~/server/generated/prisma/client";
import { prisma } from "~/server/utils/prisma";
import {
  mapGrimoireEventsForCreate,
  getTaggedPlayerIds,
  buildPlayerCharactersForToken,
} from "~/server/utils/gamePropagation";
import { findOrCreatePlayerChildGame,findOrCreateStorytellerChildGame } from "~/server/utils/childGame";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const user: User|null=handler.context.user;
  const body=await readBody<
    |(Game&{
      player_characters: (Character&{ role?: { token_url: string } })[];
      demon_bluffs: (DemonBluff&{ role?: { token_url: string } })[];
      fabled: (Fabled&{ role?: { token_url: string } })[];
      grimoire_events?: GrimoireEvent[];
      grimoire: Partial<
        Grimoire&{
          tokens: Partial<
            Token&{
              reminders: Partial<ReminderToken>[];
            }
          >[];
        }
      >[];
    })
    |null
  >(handler);

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

  const incomingGrimoireEvents: GrimoireEvent[]=body.grimoire_events??[];

  const notifications: Parameters<typeof sendPushNotifications>[0][]=[];

  const newGame=await prisma.$transaction(async (tx) => {
    const newGame=await tx.game.create({
      data: {
        end_trigger: body.end_trigger,
        end_trigger_type: body.end_trigger_type,
        end_trigger_cause: body.end_trigger_cause,
        end_trigger_role_id: body.end_trigger_role_id,
        end_trigger_note: body.end_trigger_note,
        end_trigger_participant_id: body.end_trigger_participant_id,
        ls_game_id: body.ls_game_id,
        date: new Date(body.date),
        user_id: user.id,
        script: body.script,
        script_id: body.script_id,
        storyteller: body.storyteller,
        co_storytellers: body.co_storytellers,
        is_storyteller: body.is_storyteller,
        location_type: body.location_type,
        location: body.location,
        community_name: body.community_name,
        community_id: body.community_id,
        player_count: body.player_count,
        traveler_count: body.traveler_count,
        win_v2: body.win_v2,
        ignore_for_stats: body.ignore_for_stats,
        tags: body.tags,
        notes: body.notes,
        privacy: body.privacy,
        player_characters: {
          create: [...body.player_characters],
        },
        demon_bluffs: {
          create: [...body.demon_bluffs],
        },
        fabled: {
          create: [...body.fabled],
        },
        grimoire_events: {
          create: mapGrimoireEventsForCreate(incomingGrimoireEvents),
        },
        grimoire: {
          create: [
            ...body.grimoire.map((g) => ({
              ...g,
              tokens: {
                create: g.tokens?.map((token,index) => ({
                  role_id: token.role_id,
                  related_role_id: token.related_role_id,
                  alignment: token.alignment||Alignment.NEUTRAL,
                  is_dead: token.is_dead||false,
                  used_ghost_vote: token.used_ghost_vote||false,
                  order: token.order??index,
                  grimoire_participant_id: token.grimoire_participant_id??null,
                  player_name: token.player_name||"",
                  player_id: token.player_id,
                  reminders: {
                    create:
                      token.reminders?.map((reminder) => ({
                        reminder: reminder.reminder,
                        token_url: reminder.token_url,
                        type: reminder.type??undefined,
                      }))||[],
                  },
                })),
              },
            })),
          ],
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        player_characters: true,
        grimoire_events: true,
        end_trigger_role: {
          select: {
            token_url: true,
            type: true,
            initial_alignment: true,
            name: true,
          },
        },
        demon_bluffs: true,
        fabled: true,
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

    const taggedPlayers=getTaggedPlayerIds(newGame.grimoire,user.id);

    for(const id of taggedPlayers) {
      const player_characters=buildPlayerCharactersForToken(
        newGame.grimoire,
        id,
      );

      try {
        await findOrCreatePlayerChildGame({
          db: tx,
          game: newGame,
          playerId: id,
          playerCharacters: player_characters,
          relatedGames: [], // new game has no children yet
        });
      } catch(err: any) {
        const taggedPlayer=
          newGame.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id===id)
            ?.player_name||"Unknown";
        console.error(`Error creating child game for ${taggedPlayer}: ${err.message}`);
        throw err;
      }
    }

    // Notify tagged players
    const playerIdsToNotify=[...taggedPlayers].filter((id): id is string => !!id&&id!==user.id);
    if(playerIdsToNotify.length>0&&newGame.user) {
      notifications.push({
        userIds: playerIdsToNotify,
        title: "You've been tagged in a game",
        body: `${newGame.user.username} tagged you in a game of ${newGame.script}`,
        url: `/@${newGame.user.username}`,
      });
    }

    const storytellers=[newGame.storyteller,...newGame.co_storytellers];

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
              game: newGame,
              storytellerUserId: friend.user_id,
              childGames: [], // new game has no children yet
            });
          } catch(err: any) {
            console.error(`Error creating storyteller child game for ${storyteller}: ${err.message}`);
            throw err;
          }

          if(newGame.user) {
            notifications.push({
              userIds: [friend.user_id],
              title: "You've been tagged as storyteller",
              body: `${newGame.user.username} tagged you as storyteller in a game of ${newGame.script}`,
              url: `/@${newGame.user.username}`,
            });
          }
        }
      }
    }

    return newGame;
  });

  for(const notification of notifications) {
    void sendPushNotifications(notification);
  }

  return newGame;
});
