import { PrismaClient, PrivacySetting } from "@prisma/client";
import type { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

type PlayerSummary = {
  key: string;
  user_id: string | null;
  username: string;
  avatar: string | null;
   priority: number;
  plays: number;
  wins: number;
  losses: number;
  good_plays: number;
  evil_plays: number;
  drunk_plays: number;
  lunatic_plays: number;
  mutant_plays: number;
  damsel_plays: number;
  traveler_plays: number;
  storyteller_plays: number;
  role_tokens: Record<string, string | null>;
  role_games: Record<string, string[]>;
  role_details: Record<
    string,
    { token_url: string | null; type: string | null; initial_alignment: string | null }
  >;
  roles: Record<string, number>;
};

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params?.slug as string;

  const community = await prisma.community.findUnique({
    where: { slug },
    select: {
      id: true,
      is_private: true,
      members: { select: { user_id: true } },
      banned_users: { select: { user_id: true } },
    },
  });

  if (!community) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  if (
    community.banned_users.some((banned) => banned.user_id === me?.id)
  ) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  if (
    community.is_private &&
    !community.members.some((member) => member.user_id === me?.id)
  ) {
    return emptyStats();
  }

  const games = await prisma.game.findMany({
    where: {
      deleted: false,
      community_id: community.id,
      privacy: PrivacySetting.PUBLIC,
      parent_game_id: null,
    },
    select: {
      id: true,
      user: {
        select: {
          user_id: true,
          username: true,
          avatar: true,
        },
      },
      storyteller: true,
      co_storytellers: true,
      is_storyteller: true,
      win_v2: true,
      ignore_for_stats: true,
      grimoire: {
        select: {
          tokens: {
            select: {
              alignment: true,
              role: {
                select: {
                  name: true,
                  type: true,
                  initial_alignment: true,
                  token_url: true,
                },
              },
              player: {
                select: {
                  user_id: true,
                  username: true,
                  avatar: true,
                },
              },
              player_name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { date: "desc" },
      { created_at: "desc" },
      { id: "desc" },
    ],
  });

  const memberIds = new Set(community.members.map((m) => m.user_id));

  const calcPriority = (userId: string | null) => {
    if (userId && memberIds.has(userId)) return 2; // community member
    if (userId) return 1; // known user
    return 0; // anonymous
  };

  const stats = new Map<string, PlayerSummary>();

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    const result = game.win_v2;
    const storytellerUserId =
      game.is_storyteller && game.user?.user_id ? game.user.user_id : null;
    const storytellerNames = new Set<string>();
    const ownerUsername = game.user?.username?.toLowerCase();
    if (game.storyteller?.trim()) {
      const name = game.storyteller.trim();
      if (!ownerUsername || name.toLowerCase() !== ownerUsername) {
        storytellerNames.add(name);
      }
    }
    if (Array.isArray(game.co_storytellers)) {
      for (const co of game.co_storytellers) {
        const name = co?.trim();
        if (!name) continue;
        if (!ownerUsername || name.toLowerCase() !== ownerUsername) {
          storytellerNames.add(name);
        }
      }
    }

    // Collect data per player for this game to avoid counting multiple pages/tokens
    // as multiple separate plays.
    const perPlayerForGame = new Map<
      string,
      {
        identity: { key: string; user_id: string | null; username: string; avatar: string | null };
        alignment: "GOOD" | "EVIL" | null;
        roles: Set<string>;
        roleTokens: Map<string, string | null>;
        travelerCount: number;
        isStoryteller: boolean;
        roleDetails: Map<
          string,
          { token_url: string | null; type: string | null; initial_alignment: string | null }
        >;
      }
    >();

    for (const page of game.grimoire) {
      for (const token of page.tokens) {
        // Skip fabled/loring/reminder tokens.
        if (token.role?.type === "FABLED" || token.role?.type === "LORIC") {
          continue;
        }

        const playerIdentity = resolvePlayerIdentity(token.player, token.player_name);
        if (!playerIdentity) continue;

        // Skip storyteller tokens; storyteller is counted separately below.
        if (
          storytellerUserId &&
          game.is_storyteller &&
          playerIdentity.user_id === storytellerUserId
        ) {
          continue;
        }

        const alignment = token.alignment || token.role?.initial_alignment || null;
        if (!alignment || (alignment !== "GOOD" && alignment !== "EVIL")) {
          continue;
        }

        let playerEntry = perPlayerForGame.get(playerIdentity.key);
        if (!playerEntry) {
          playerEntry = {
            identity: playerIdentity,
            alignment,
            roles: new Set<string>(),
            roleTokens: new Map<string, string | null>(),
            travelerCount: 0,
            isStoryteller: false,
            roleDetails: new Map(),
          };
          perPlayerForGame.set(playerIdentity.key, playerEntry);
        }

        // Update alignment to the latest seen (later pages should win).
        playerEntry.alignment = alignment;

        if (token.role?.name) {
          playerEntry.roles.add(token.role.name);
          if (!playerEntry.roleTokens.has(token.role.name)) {
            playerEntry.roleTokens.set(token.role.name, token.role.token_url ?? null);
          }
          if (!playerEntry.roleDetails.has(token.role.name)) {
            playerEntry.roleDetails.set(token.role.name, {
              token_url: token.role.token_url ?? null,
              type: token.role.type ?? null,
              initial_alignment: token.role.initial_alignment ?? null,
            });
          }
          if (token.role.type === "TRAVELER") {
            playerEntry.travelerCount++;
          }
        }
      }
    }

    // Add storyteller (game owner) entry if present
    if (game.is_storyteller && game.user) {
      const storytellerId = `user:${game.user.user_id}`;
      const existingStory = perPlayerForGame.get(storytellerId);
      if (existingStory) {
        existingStory.isStoryteller = true;
      } else {
        perPlayerForGame.set(storytellerId, {
          identity: {
            key: storytellerId,
            user_id: game.user.user_id,
            username: game.user.username,
            avatar: game.user.avatar,
          },
          alignment: null,
          roles: new Set<string>(),
          roleTokens: new Map<string, string | null>(),
          travelerCount: 0,
          isStoryteller: true,
          roleDetails: new Map(),
        });
      }
    }

    // Add storyteller/co-storyteller entries based on username fields (even without tokens).
    if (storytellerNames.size) {
      for (const name of storytellerNames) {
        const key = `name:${name.toLowerCase()}`;
        const existingStory = perPlayerForGame.get(key);
        if (existingStory) {
          existingStory.isStoryteller = true;
        } else {
          perPlayerForGame.set(key, {
            identity: {
              key,
              user_id: null,
              username: name,
              avatar: null,
            },
            alignment: null,
            roles: new Set<string>(),
            roleTokens: new Map<string, string | null>(),
            travelerCount: 0,
            isStoryteller: true,
            roleDetails: new Map(),
          });
        }
      }
    }

    // Apply per-player aggregates for this game.
    for (const [, entry] of perPlayerForGame) {
      const { identity, alignment, roles, roleTokens, travelerCount, isStoryteller, roleDetails } = entry;

      const existing = stats.get(identity.key) ?? {
        key: identity.key,
        user_id: identity.user_id,
        username: identity.username,
        avatar: identity.avatar,
        priority: calcPriority(identity.user_id),
        plays: 0,
        wins: 0,
        losses: 0,
        good_plays: 0,
        evil_plays: 0,
        drunk_plays: 0,
        lunatic_plays: 0,
        mutant_plays: 0,
        damsel_plays: 0,
        traveler_plays: 0,
        storyteller_plays: 0,
        role_tokens: {},
        role_games: {},
        role_details: {},
        roles: {},
      } satisfies PlayerSummary;

      existing.priority = Math.max(existing.priority, calcPriority(identity.user_id));

      // Count non-storyteller plays; if this is a storyteller-only entry (no roles),
      // skip incrementing plays to avoid double-counting.
      if (!(isStoryteller && roles.size === 0)) {
        existing.plays++;
      }
      if (alignment === "GOOD") existing.good_plays++;
      if (alignment === "EVIL") existing.evil_plays++;

      if (result === "GOOD_WINS" || result === "EVIL_WINS") {
        const goodWon = result === "GOOD_WINS";
        const evilWon = result === "EVIL_WINS";

        if ((alignment === "GOOD" && goodWon) || (alignment === "EVIL" && evilWon)) {
          existing.wins++;
        } else if ((alignment === "GOOD" && evilWon) || (alignment === "EVIL" && goodWon)) {
          existing.losses++;
        }
      }

      for (const roleName of roles) {
        existing.roles[roleName] = (existing.roles[roleName] ?? 0) + 1;
        if (roleName === "Drunk") existing.drunk_plays++;
        if (roleName === "Lunatic") existing.lunatic_plays++;
        if (roleName === "Mutant") existing.mutant_plays++;
        if (roleName === "Damsel") existing.damsel_plays++;

        if (!existing.role_tokens[roleName]) {
          existing.role_tokens[roleName] = roleTokens.get(roleName) ?? null;
        }
        if (!existing.role_details[roleName]) {
          const details = roleDetails.get(roleName);
          existing.role_details[roleName] = details ?? {
            token_url: null,
            type: null,
            initial_alignment: null,
          };
        }
        const arr = existing.role_games[roleName] ?? [];
        if (!arr.includes(game.id)) {
          arr.push(game.id);
          existing.role_games[roleName] = arr;
        }
      }

      if (travelerCount > 0) {
        existing.traveler_plays++;
      }
      if (isStoryteller) {
        existing.storyteller_plays++;
      }

      stats.set(identity.key, existing);
    }

  }

  const players = Array.from(stats.values()).sort((a, b) => b.plays - a.plays);

  return {
    totals: {
      games: games.length,
      players: players.length,
    },
    players,
  };
});

function resolvePlayerIdentity(
  player: { user_id: string; username: string; avatar: string | null } | null,
  player_name: string | null,
): { key: string; user_id: string | null; username: string; avatar: string | null } | null {
  if (player) {
    return {
      key: `user:${player.user_id}`,
      user_id: player.user_id,
      username: player.username,
      avatar: player.avatar ?? null,
    };
  }

  const name = player_name || player?.username;
  if (!name) return null;

  return {
    key: `name:${name.toLowerCase()}`,
    user_id: null,
    username: name,
    avatar: null,
  };
}

function emptyStats() {
  return {
    totals: { games: 0, players: 0 },
    players: [] as PlayerSummary[],
  };
}
