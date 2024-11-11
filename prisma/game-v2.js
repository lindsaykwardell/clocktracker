const { PrismaClient, GameV2, GameDetails } = require("@prisma/client");
const ProgressBar = require('progress');

const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      parent_game_id: null,
    },
    include: {
      user: true,
      favorite: true,
      player_characters: {
        include: {
          role: true,
          related_role: true,
        },
      },
      demon_bluffs: {
        include: {
          role: true,
        },
      },
      fabled: {
        include: {
          role: true,
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
              reminders: true,
              player: true,
            },
          },
        },
      },
      community: true,
      associated_script: true,
    },
  });

  var bar = new ProgressBar(':current / :total :bar :percent', { total: games.length });

  for (const game of games) {
    await prisma.gameV2.create({
      data: { 
        id: game.id,
        bgg_id: game.bgg_id,
        created_at: game.created_at,
        user: {
          connect: {
            user_id: game.user_id,
          },
        },
        favorite: game.favorite
          ? {
              create: {
                user: {
                  connect: {
                    user_id: game.favorite.user_id,
                  },
                },
              },
            }
          : undefined,
        characters: game.player_characters
          ? {
              createMany: {
                data: game.player_characters.map((character) => ({
                  name: character.name,
                  related: character.related,
                  alignment: character.alignment,
                  role_id: character.role_id,
                  related_role_id: character.related_role_id,
                })),
              },
            }
          : undefined,
        ignore_for_stats: game.ignore_for_stats,
        tags: game.tags,
        waiting_for_confirmation: game.waiting_for_confirmation,
        details: {
          create: {
            date: game.date,
            privacy: game.privacy,
            tags: game.tags,
            script: game.script,
            location_type: game.location_type,
            location: game.location,
            player_count: game.player_count,
            traveler_count: game.traveler_count,
            win_v2: game.win_v2,
            image_urls: game.image_urls,
            associated_script: game.associated_script
              ? {
                  connect: {
                    id: game.associated_script.id,
                  },
                }
              : undefined,
            community: game.community
              ? {
                  connect: {
                    id: game.community_id,
                  },
                }
              : undefined,
            demon_bluffs: game.demon_bluffs
              ? {
                  createMany: {
                    data: game.demon_bluffs.map((demonBluff) => ({
                      name: demonBluff.name,
                      role_id: demonBluff.role_id,
                      related: demonBluff.related,
                    })),
                  },
                }
              : undefined,
            fabled: game.fabled
              ? {
                  createMany: {
                    data: game.fabled.map((fabled) => ({
                      name: fabled.name,
                      role_id: fabled.role_id,
                      related: fabled.related,
                    })),
                  },
                }
              : undefined,
            grimoire: game.grimoire
              ? {
                  create: game.grimoire.map((grimoire) => ({
                    created_at: grimoire.created_at,
                    tokens: grimoire.tokens
                      ? {
                          create: grimoire.tokens.map((token) => ({
                            alignment: token.alignment,
                            is_dead: token.is_dead,
                            used_ghost_vote: token.used_ghost_vote,
                            order: token.order,
                            created_at: token.created_at,
                            player_name: token.player_name,
                            role: token.role
                              ? {
                                  connect: {
                                    id: token.role_id,
                                  },
                                }
                              : undefined,
                            related_role: token.related_role_id
                              ? {
                                  connect: {
                                    id: token.related_role_id,
                                  },
                                }
                              : undefined,
                            player: token.player
                              ? {
                                  connect: {
                                    user_id: token.player_id,
                                  },
                                }
                              : undefined,
                            reminders: token.reminders
                              ? {
                                  createMany: {
                                    data: token.reminders.map((reminder) => ({
                                      reminder: reminder.reminder,
                                      token_url: reminder.token_url,
                                      created_at: reminder.created_at,
                                    })),
                                  },
                                }
                              : undefined,
                          })),
                        }
                      : undefined,
                  })),
                }
              : undefined,
          },
        },
      },
    });

    bar.tick();
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
