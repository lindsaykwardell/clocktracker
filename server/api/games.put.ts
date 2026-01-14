import type { User } from "@supabase/supabase-js";
import {
  Alignment,
  LocationType,
  WinStatus_V2,
  PrivacySetting,
} from "@prisma/client";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<{
    game_ids: string[];
    script: string;
    script_id: number | null;
    storyteller: string;
    co_storytellers: string[];
    is_storyteller: boolean;
    location_type: LocationType | undefined;
    location: string;
    community_name: string;
    community_id: number | null;
    player_count: number | null;
    traveler_count: number | null;
    win_v2: WinStatus_V2 | undefined;
    tags: string[];
    privacy: PrivacySetting | "";
  } | null>(handler);

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

  const games = await prisma.game.findMany({
    where: {
      id: {
        in: body.game_ids,
      },
      user_id: user.id,
    },
  });

  for (const payload of games) {
    const game = await prisma.game.update({
      where: {
        id: payload.id,
      },
      data: {
        script: body.script || payload.script,
        script_id: body.script_id || payload.script_id,
        storyteller: body.storyteller || payload.storyteller,
        co_storytellers:
          body.co_storytellers.length > 0
            ? body.co_storytellers
            : payload.co_storytellers,
        is_storyteller: body.is_storyteller || payload.is_storyteller,
        location_type: body.location_type || payload.location_type,
        location: body.location || payload.location,
        community_name: body.community_name || payload.community_name,
        community_id: body.community_id || payload.community_id,
        player_count: body.player_count || payload.player_count,
        traveler_count: body.traveler_count || payload.traveler_count,
        win_v2: body.win_v2 || payload.win_v2,
        tags: [...payload.tags, ...body.tags],
        privacy: body.privacy || payload.privacy,
      },
      include: {
        player_characters: true,
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
      tags: game.tags,
      privacy: game.privacy,
    });

    const related_games = [...game.child_games];

    if (game.parent_game) {
      related_games.push(game.parent_game);
      related_games.push(...game.parent_game.child_games);
    }

    const taggedPlayers = new Set(
      game.grimoire.flatMap((g) => g.tokens?.map((t) => t.player_id))
    );

    for (const id of taggedPlayers) {
      if (!id || id === user.id) continue;

      // Reduce grimoire to find all tokens that have this player_id
      const player_characters = game.grimoire.reduce(
        (acc, g) => {
          const tokens = g.tokens?.filter((t) => t.player_id === id);
          if (tokens) {
            for (const token of tokens) {
            // Avoid duplicating identical consecutive tokens (same role/related/alignment)
            const lastToken = acc[acc.length - 1];
            if (
              lastToken &&
              lastToken.role_id === token.role_id &&
              lastToken.related_role_id === token.related_role_id &&
              lastToken.alignment === token.alignment
            ) {
              continue;
            }

              acc.push({
                name: token.role?.name || "",
                alignment: token.alignment,
                related: token.related_role?.name || "",
                role_id: token.role_id,
                related_role_id: token.related_role_id,
              });
            }
          }

          return acc;
        },
        [] as {
          name: string;
          alignment: Alignment;
          related: string;
          role_id: string | null;
          related_role_id: string | null;
        }[]
      );

      const relatedGame = related_games?.find((g) => g!.user_id === id);

      try {
        if (!relatedGame) {
          await prisma.game.create({
            data: {
              ...game,
              community: undefined,
              associated_script: undefined,
              parent_game: undefined,
              child_games: undefined,
              date: new Date(game.date),
              user_id: id,
              player_characters: {
                create: [...player_characters],
              },
              demon_bluffs: {
                create: [...game.demon_bluffs],
              },
              fabled: {
                create: [...game.fabled],
              },
              // map the already created grimoires to the new game
              grimoire: {
                connect: game.grimoire.map((g) => ({ id: g.id })),
              },
              parent_game_id: game.parent_game_id || game.id,
              waiting_for_confirmation: true,
              is_storyteller: false,
            },
          });
        } else {
          await prisma.game.update({
            where: {
              id: relatedGame.id,
            },
            data: {
              date: new Date(game.date),
              script: game.script,
              script_id: game.script_id,
              location_type: game.location_type,
              location: game.location,
              community_name: game.community_name,
              community_id: game.community_id,
              player_count: game.player_count,
              traveler_count: game.traveler_count,
              storyteller: game.storyteller,
              co_storytellers: game.co_storytellers,
              win_v2: game.win_v2,
              demon_bluffs: {
                deleteMany: relatedGame.demon_bluffs.map((g) => ({ id: g.id })),
                create: game.demon_bluffs.map((g) => ({
                  ...g,
                  id: undefined,
                  game_id: undefined,
                })),
              },
              fabled: {
                deleteMany: relatedGame.fabled.map((g) => ({ id: g.id })),
                create: game.fabled.map((g) => ({
                  ...g,
                  id: undefined,
                  game_id: undefined,
                })),
              },
              player_characters: {
                deleteMany: relatedGame.player_characters.map((g) => ({
                  id: g.id,
                })),
                create: player_characters,
              },
              grimoire: {
                connect: game.grimoire.map((g) => ({ id: g.id })),
              },
            },
          });
        }
      } catch (err: any) {
        const messageLines = err.message.split("\n");
        const message =
          messageLines[messageLines.length - 1].length > 0
            ? messageLines[messageLines.length - 1]
            : err.message;
        // get the name from the game.grimoire
        const taggedPlayer =
          game.grimoire.flatMap((g) => g.tokens).find((t) => t.player_id === id)
            ?.player_name || "Unknown";

        console.error(`Error saving for ${taggedPlayer}: ${message}`);

        throw createError({
          status: 500,
          statusMessage: `Error saving for ${taggedPlayer}: ${message}`,
        });
      }
    }

    const storytellers = [game.storyteller, ...game.co_storytellers];

    for (const storyteller of storytellers) {
      if (storyteller?.includes("@")) {
        // Verify that it's a friend
        const friend = await prisma.userSettings.findUnique({
          where: {
            username: storyteller.replace("@", ""),
            friends: {
              some: {
                user_id: user.id,
              },
            },
          },
        });

        if (friend !== null) {
          const childGame = game.child_games?.find(
            (g) => g.user_id === friend.user_id
          );

          if (!childGame) {
            await prisma.game.create({
              data: {
                ...game,
                community: undefined,
                associated_script: undefined,
                parent_game: undefined,
                child_games: undefined,
                is_storyteller: true,
                date: new Date(game.date),
                user_id: friend.user_id,
                player_characters: {},
                demon_bluffs: {
                  create: [...game.demon_bluffs],
                },
                fabled: {
                  create: [...game.fabled],
                },
                notes: "",
                grimoire: {
                  connect: game.grimoire.map((g) => ({ id: g.id })),
                },
                parent_game_id: game.id,
                waiting_for_confirmation: true,
                tags: [],
              },
            });
          } else {
            await prisma.game.update({
              where: {
                id: childGame.id,
              },
              data: {
                date: new Date(game.date),
                script: game.script,
                script_id: game.script_id,
                location_type: game.location_type,
                location: game.location,
                community_name: game.community_name,
                community_id: game.community_id,
                player_count: game.player_count,
                traveler_count: game.traveler_count,
                storyteller: game.storyteller,
                co_storytellers: game.co_storytellers,
                win_v2: game.win_v2,
                demon_bluffs: {
                  deleteMany: childGame.demon_bluffs.map((g) => ({ id: g.id })),
                  create: game.demon_bluffs.map((g) => ({
                    ...g,
                    id: undefined,
                    game_id: undefined,
                  })),
                },
                fabled: {
                  deleteMany: childGame.fabled.map((g) => ({ id: g.id })),
                  create: game.fabled.map((g) => ({
                    ...g,
                    id: undefined,
                    game_id: undefined,
                  })),
                },
                grimoire: {
                  connect: game.grimoire.map((g) => ({ id: g.id })),
                },
              },
            });
          }
        }
      }
    }
  }
});
