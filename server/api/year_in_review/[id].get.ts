import {
  Character,
  PrismaClient,
  PrivacySetting,
  Role,
  RoleType,
  WinStatus_V2,
} from "@prisma/client";
import { User } from "@supabase/supabase-js";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const year_in_review_id = handler.context.params?.id as string;

  const yearInReview = await prisma.yearInReview.findFirst({
    where: {
      id: year_in_review_id,
      user: {
        OR: [
          {
            privacy: PrivacySetting.PUBLIC,
          },
          {
            privacy: PrivacySetting.PRIVATE,
          },
          {
            privacy: PrivacySetting.FRIENDS_ONLY,
            friends: {
              some: {
                user_id: me?.id,
              },
            },
          },
          {
            user_id: me?.id,
          },
        ],
      },
    },
    include: {
      user: {
        select: {
          privacy: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
    },
  });

  if (!yearInReview) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Get the player's games.

  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      user_id: yearInReview.user_id,
      date: {
        gte: new Date(yearInReview.year, 0, 1),
        lt: new Date(yearInReview.year + 1, 0, 1),
      },
    },
    include: {
      ls_game: {
        select: {
          campaign: {
            select: {
              title: true,
              id: true,
            }
          }
        }
      },
      user: {
        select: {
          privacy: true,
          username: true,
        },
      },
      player_characters: {
        include: {
          role: true,
          related_role: true,
        },
        where: {
          name: {
            not: "",
          },
        },
      },
      demon_bluffs: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
        },
      },
      fabled: {
        include: {
          role: {
            select: {
              token_url: true,
            },
          },
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
                  display_name: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      community: {
        select: {
          slug: true,
          icon: true,
          name: true,
        },
      },
      associated_script: {
        select: {
          name: true,
          version: true,
          script_id: true,
          is_custom_script: true,
          logo: true,
          background: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  // Get the average number of games played by all users in the same year
  const groupGames = await prisma.game.groupBy({
    by: ["user_id"],
    where: {
      deleted: false,
      date: {
        gte: new Date(yearInReview.year, 0, 1),
        lt: new Date(yearInReview.year + 1, 0, 1),
      },
    },
    _count: {
      id: true,
    },
  });

  const average_games_played =
    groupGames.reduce((acc, groupGame) => acc + groupGame._count.id, 0) /
    groupGames.length;

  const usernames = await prisma.userSettings
    .findMany({
      where: {
        games: {
          some: {
            date: {
              gte: new Date(yearInReview.year, 0, 1),
              lt: new Date(yearInReview.year + 1, 0, 1),
            },
          },
        },
      },
      select: {
        username: true,
      },
    })
    .then((userSettings) =>
      userSettings.map((userSetting) => userSetting.username)
    );

  const groupStorytoldGames = await prisma.game.groupBy({
    by: ["user_id"],
    where: {
      deleted: false,
      OR: [
        {
          is_storyteller: true,
        },
        {
          storyteller: {
            in: usernames.map((username) => `@${username}`),
          },
        },
        {
          co_storytellers: {
            hasSome: usernames.map((username) => `@${username}`),
          },
        },
      ],
      date: {
        gte: new Date(yearInReview.year, 0, 1),
        lt: new Date(yearInReview.year + 1, 0, 1),
      },
    },
    _count: {
      id: true,
    },
  });

  // Get the average number of games told by all users in the same year
  const average_games_storytold =
    groupStorytoldGames.reduce(
      (acc, groupStorytoldGame) => acc + groupStorytoldGame._count.id,
      0
    ) / groupStorytoldGames.length;

  const games_played = games.filter(
    (game) =>
      !(
        game.is_storyteller ||
        game.storyteller === `@${yearInReview.user.username}` ||
        game.co_storytellers?.includes(`@${yearInReview.user.username}`)
      )
  ).length;
  const games_storytold = games.filter(
    (game) =>
      game.is_storyteller ||
      game.storyteller === `@${yearInReview.user.username}` ||
      game.co_storytellers?.includes(`@${yearInReview.user.username}`)
  ).length;
  const roles: {
    role: Role;
    count: number;
  }[] = [];
  const related_roles: {
    role: Role;
    count: number;
  }[] = [];
  const character_changes: {
    characters: (Character & {
      role: Role;
      related_role: Role;
    })[];
    script: string;
    logo: string | null;
  }[] = [];
  let win_rate = 0;
  let win_rate_good = 0;
  let win_rate_evil = 0;
  let loss_rate = 0;
  const role_types = {
    [RoleType.TOWNSFOLK]: 0,
    [RoleType.OUTSIDER]: 0,
    [RoleType.MINION]: 0,
    [RoleType.DEMON]: 0,
    [RoleType.TRAVELER]: 0,
  };
  const winning_roles: {
    role_id: string;
    win_count: number;
  }[] = [];
  const losing_roles: {
    role_id: string;
    loss_count: number;
  }[] = [];
  const most_common_scripts: {
    script: string;
    logo: string | null;
    count: number;
  }[] = [];
  const most_common_storytold_scripts: {
    script: string;
    logo: string | null;
    count: number;
  }[] = [];
  const most_common_players: {
    display_name: string;
    username: string | null;
    avatar: string | null;
    count: number;
  }[] = [];
  const most_common_comunities: {
    slug: string;
    icon: string;
    name: string;
    count: number;
  }[] = [];

  const months = Array.from(Array(12).keys())
    .map((i) => dayjs().subtract(i, "month").format("MMMM"))
    .reverse();

  const games_by_month = Object.fromEntries(
    months.map((month) => [
      month,
      {
        total: 0,
        win: 0,
        loss: 0,
        good: 0,
        evil: 0,
      },
    ])
  );

  games.forEach((game) => {
    // If the game is not in the past 12 months, skip it
    if (dayjs(game.date).isBefore(dayjs().subtract(12, "month"))) {
      return;
    }
    const month = dayjs(game.date).format("MMMM");
    games_by_month[month].total = games_by_month[month].total + +1;

    if (game.script) {
      const scriptIndex = most_common_scripts.findIndex(
        (script) => script.script === game.script
      );
      if (scriptIndex === -1) {
        most_common_scripts.push({
          script: game.script,
          count: 1,
          logo: game.associated_script?.logo ?? null,
        });
      } else {
        most_common_scripts[scriptIndex].count =
          most_common_scripts[scriptIndex].count + 1;
      }
    }

    if (
      game.script &&
      (game.is_storyteller ||
        game.storyteller === `@${yearInReview.user.username}` ||
        game.co_storytellers?.includes(`@${yearInReview.user.username}`))
    ) {
      const scriptIndex = most_common_storytold_scripts.findIndex(
        (script) => script.script === game.script
      );
      if (scriptIndex === -1) {
        most_common_storytold_scripts.push({
          script: game.script,
          count: 1,
          logo: game.associated_script?.logo ?? null,
        });
      } else {
        most_common_storytold_scripts[scriptIndex].count =
          most_common_storytold_scripts[scriptIndex].count + 1;
      }
    } else {
      if (game.player_characters.length > 1) {
        character_changes.push({
          characters: game.player_characters as any,
          script: game.script,
          logo: game.associated_script?.logo ?? null,
        });
      }

      const lastCharacter =
        game.player_characters[game.player_characters.length - 1];

      if (lastCharacter?.role) {
        const roleIndex = roles.findIndex(
          (role) => role.role.id === lastCharacter.role!.id
        );
        if (roleIndex === -1) {
          roles.push({
            role: lastCharacter.role,
            count: 1,
          });
        } else {
          roles[roleIndex].count = roles[roleIndex].count + 1;
        }
      }
      if (lastCharacter?.related_role) {
        const relatedRoleIndex = related_roles.findIndex(
          (role) => role.role.id === lastCharacter.related_role!.id
        );
        if (relatedRoleIndex === -1) {
          related_roles.push({
            role: lastCharacter.related_role,
            count: 1,
          });
        } else {
          related_roles[relatedRoleIndex].count =
            related_roles[relatedRoleIndex].count + 1;
        }
      }

      const lastAlignment = lastCharacter?.alignment;

      if (lastAlignment === "GOOD") {
        games_by_month[month].good = games_by_month[month].good + 1;
      } else if (lastAlignment === "EVIL") {
        games_by_month[month].evil = games_by_month[month].evil + 1;
      }

      switch (lastCharacter?.role?.type) {
        case RoleType.TOWNSFOLK:
          role_types[RoleType.TOWNSFOLK] = role_types[RoleType.TOWNSFOLK] + 1;
          break;
        case RoleType.OUTSIDER:
          role_types[RoleType.OUTSIDER] = role_types[RoleType.OUTSIDER] + 1;
          break;
        case RoleType.MINION:
          role_types[RoleType.MINION] = role_types[RoleType.MINION] + 1;
          break;
        case RoleType.DEMON:
          role_types[RoleType.DEMON] = role_types[RoleType.DEMON] + 1;
          break;
        case RoleType.TRAVELER:
          role_types[RoleType.TRAVELER] = role_types[RoleType.TRAVELER] + 1;
          break;
      }

      if (
        (lastAlignment === "GOOD" && game.win_v2 === WinStatus_V2.GOOD_WINS) ||
        (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.EVIL_WINS)
      ) {
        games_by_month[month].win = games_by_month[month].win + 1;
        win_rate = win_rate + 1;

        if (lastCharacter?.role) {
          const roleIndex = winning_roles.findIndex(
            (role) => role.role_id === lastCharacter.role_id
          );
          if (roleIndex === -1) {
            winning_roles.push({
              role_id: lastCharacter.role.id,
              win_count: 1,
            });
          } else {
            winning_roles[roleIndex].win_count =
              winning_roles[roleIndex].win_count + 1;
          }

          if (lastAlignment === "GOOD") {
            win_rate_good = win_rate_good + 1;
          } else if (lastAlignment === "EVIL") {
            win_rate_evil = win_rate_evil + 1;
          }
        }
      } else if (
        (lastAlignment === "GOOD" && game.win_v2 === WinStatus_V2.EVIL_WINS) ||
        (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.GOOD_WINS)
      ) {
        games_by_month[month].loss = games_by_month[month].loss + 1;
        loss_rate = loss_rate + 1;

        if (lastCharacter?.role) {
          const roleIndex = losing_roles.findIndex(
            (role) => role.role_id === lastCharacter.role_id
          );
          if (roleIndex === -1) {
            losing_roles.push({
              role_id: lastCharacter.role.id,
              loss_count: 1,
            });
          } else {
            losing_roles[roleIndex].loss_count =
              losing_roles[roleIndex].loss_count + 1;
          }
        }
      }
    }

    // Just use the final page of the grimoire for now
    const grimoirePage = game.grimoire[game.grimoire.length - 1];

    if (grimoirePage) {
      grimoirePage.tokens.forEach((token) => {
        if (
          (token.player || token.player_name) &&
          token.player_name !== yearInReview.user.display_name &&
          token.player?.username !== yearInReview.user.username
        ) {
          const playerIndex = most_common_players.findIndex((player) =>
            token.player
              ? token.player.username === player.username
              : player.display_name === token.player_name
          );
          if (playerIndex === -1) {
            most_common_players.push({
              display_name: token.player?.display_name || token.player_name,
              username: token.player?.username ?? null,
              avatar: token.player?.avatar ?? null,
              count: 1,
            });
          } else {
            most_common_players[playerIndex].count =
              most_common_players[playerIndex].count + 1;
          }
        }
      });
    }

    if (game.community) {
      const communityIndex = most_common_comunities.findIndex(
        (community) => community.slug === game.community!.slug
      );
      if (communityIndex === -1) {
        most_common_comunities.push({
          slug: game.community.slug,
          icon: game.community.icon,
          name: game.community.name,
          count: 1,
        });
      } else {
        most_common_comunities[communityIndex].count =
          most_common_comunities[communityIndex].count + 1;
      }
    }
  });

  let largest_character_change =
    character_changes.length > 0 ? character_changes[0] : null;

  for (const change of character_changes) {
    if (
      change.characters.length >
      (largest_character_change?.characters.length ?? 0)
    ) {
      largest_character_change = change;
    }
  }

  return {
    username: yearInReview.user.username,
    display_name: yearInReview.user.display_name,
    avatar: yearInReview.user.avatar,
    year: yearInReview.year,
    games_played,
    average_games_played,
    games_storytold,
    average_games_storytold,
    roles: roles.toSorted((a, b) => b.count - a.count),
    related_roles: related_roles.toSorted((a, b) => b.count - a.count),
    largest_character_change,
    win_rate,
    win_rate_good,
    win_rate_evil,
    loss_rate,
    role_types,
    winning_roles,
    losing_roles,
    games_by_month,
    most_common_storytold_scripts: most_common_storytold_scripts
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 5),
    most_common_scripts: most_common_scripts
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 5),
    most_common_players: most_common_players.toSorted(
      (a, b) => b.count - a.count
    ),
  };
});
