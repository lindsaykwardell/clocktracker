import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import {
  type Game,
  type Character,
  type Grimoire,
  type Token,
  Alignment,
  type DemonBluff,
  type Fabled,
  type ReminderToken,
  type GrimoireEvent,
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
  const gameId=handler.context.params?.id;
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

  if(!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const incomingGrimoireEvents: GrimoireEvent[]=body.grimoire_events??[];

  const existingGame=await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      player_characters: true,
      demon_bluffs: true,
      fabled: true,
    },
  });

  if(!existingGame||existingGame.user_id!==user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const notifications: Parameters<typeof sendPushNotifications>[0][]=[];

  const game=await prisma.$transaction(async (tx) => {
    // Snapshot existing grimoire state before any modifications
    const existingGrimoires=await tx.grimoire.findMany({
      where: {
        game: { some: { id: gameId } },
      },
      include: {
        tokens: {
          include: {
            role: true,
            related_role: true,
            reminders: true,
          },
        },
      },
    });

    if(existingGrimoires.length>0) {
      await tx.grimoireSnapshot.create({
        data: {
          game_id: gameId,
          snapshot: JSON.parse(JSON.stringify({
            pages: existingGrimoires.map((grimoire) => ({
              id: grimoire.id,
              tokens: grimoire.tokens.map((token) => ({
                id: token.id,
                role_id: token.role_id,
                role_name: token.role?.name??null,
                related_role_id: token.related_role_id,
                related_role_name: token.related_role?.name??null,
                alignment: token.alignment,
                is_dead: token.is_dead,
                used_ghost_vote: token.used_ghost_vote,
                order: token.order,
                player_name: token.player_name,
                player_id: token.player_id,
                grimoire_participant_id: token.grimoire_participant_id,
                reminders: token.reminders.map((r) => ({
                  id: r.id,
                  reminder: r.reminder,
                  token_url: r.token_url,
                  type: r.type,
                })),
              })),
            })),
          })),
        },
      });
    }

    const game=await tx.game.update({
      where: {
        id: gameId,
      },
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
        image_urls: body.image_urls,
        player_characters: {
          deleteMany: {
            id: {
              in: existingGame.player_characters.map((character) => character.id),
            },
          },
          create: [...body.player_characters],
        },
        demon_bluffs: {
          deleteMany: {
            id: {
              in: existingGame.demon_bluffs.map((bluff) => bluff.id),
            },
          },
          create: [...body.demon_bluffs],
        },
        fabled: {
          deleteMany: {
            id: {
              in: existingGame.fabled.map((fabled) => fabled.id),
            },
          },
          create: [...body.fabled],
        },
        grimoire_events: {
          deleteMany: {},
          create: mapGrimoireEventsForCreate(incomingGrimoireEvents),
        },
        grimoire: {
          deleteMany: {
            id: {
              notIn: body.grimoire.filter((g) => !!g.id).map((g) => g.id!),
            },
          },
          create: [
            ...body.grimoire
              .filter((g) => !g.id)
              .map((g) => ({
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
          update: [
            ...body.grimoire
              .filter((g) => g.id)
              .map((g) => ({
                where: {
                  id: g.id,
                },
                data: {
                  tokens: {
                    deleteMany: {
                      id: {
                        notIn: g.tokens
                          ?.filter((token) => !!token.id)
                          .map((token) => token.id!),
                      },
                    },
                    create: g.tokens
                      ?.filter((token) => !token.id)
                      .map((token,index) => ({
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
                    update: g.tokens
                      ?.filter((token) => token.id)
                      .map((token,index) => ({
                        where: {
                          id: token.id,
                        },
                        data: {
                          role_id: token.role_id??null,
                          related_role_id: token.related_role_id??null,
                          alignment: token.alignment||Alignment.NEUTRAL,
                          is_dead: token.is_dead||false,
                          used_ghost_vote: token.used_ghost_vote||false,
                          order: token.order??index,
                          grimoire_participant_id: token.grimoire_participant_id??null,
                          player_name: token.player_name||"",
                          player_id: token.player_id??null,
                          reminders: {
                            deleteMany: {
                              id: {
                                notIn: token.reminders
                                  ?.filter((reminder) => !!reminder.id)
                                  .map((reminder) => reminder.id!),
                              },
                            },
                            create: token.reminders
                              ?.filter((reminder) => !reminder.id)
                              .map((reminder) => ({
                                reminder: reminder.reminder,
                                token_url: reminder.token_url,
                                type: reminder.type??undefined,
                              })),
                            update: token.reminders
                              ?.filter((reminder) => reminder.id)
                              .map((reminder) => ({
                                where: {
                                  id: reminder.id,
                                },
                                data: {
                                  reminder: reminder.reminder,
                                  token_url: reminder.token_url,
                                  type: reminder.type??undefined,
                                },
                              })),
                          },
                        },
                      })),
                  },
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
        demon_bluffs: true,
        fabled: true,
        grimoire_events: true,
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

    // Notify tagged players
    const playerIdsToNotify=[...taggedPlayers].filter((id): id is string => !!id&&id!==user.id);
    if(playerIdsToNotify.length>0&&game.user) {
      notifications.push({
        userIds: playerIdsToNotify,
        title: "You've been tagged in a game",
        body: `${game.user.username} tagged you in a game of ${game.script}`,
        url: `/@${game.user.username}`,
      });
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

          if(game.user) {
            notifications.push({
              userIds: [friend.user_id],
              title: "You've been tagged as storyteller",
              body: `${game.user.username} tagged you as storyteller in a game of ${game.script}`,
              url: `/@${game.user.username}`,
            });
          }
        }
      }
    }

    return game;
  });

  for(const notification of notifications) {
    void sendPushNotifications(notification);
  }

  return game;
});
