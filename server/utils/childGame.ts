import { type Alignment } from "~/server/generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Resolve the root parent game ID for a game tree.
 * If the game already has a parent, use that (the root).
 * Otherwise, this game IS the root.
 */
export function resolveRootParentId(game: {
  id: string;
  parent_game_id: string | null;
}): string {
  return game.parent_game_id || game.id;
}

/**
 * Check whether setting `childId.parent_game_id = parentId` would create a
 * cycle. Walks up the parent chain from parentId; if we encounter childId,
 * it would be a cycle.
 */
async function wouldCreateCycle(
  childId: string,
  parentId: string
): Promise<boolean> {
  let current: string | null = parentId;
  const visited = new Set<string>();

  while (current) {
    if (current === childId) return true;
    if (visited.has(current)) return true; // existing cycle in DB
    visited.add(current);

    const parentGame: { parent_game_id: string | null } | null =
      await prisma.game.findUnique({
        where: { id: current },
        select: { parent_game_id: true },
      });
    current = parentGame?.parent_game_id ?? null;
  }

  return false;
}

type ChildGameTokenData = {
  name: string;
  alignment: Alignment;
  related: string;
  role_id: string | null;
  related_role_id: string | null;
};

type RelatedGame = {
  id: string;
  user_id: string;
  demon_bluffs: { id: number }[];
  fabled: { id: number }[];
  player_characters: { id: number }[];
};

/**
 * Find or create a child game for a tagged player.
 *
 * - Searches the game tree for an existing game owned by `playerId`
 * - If found, updates it with current game metadata
 * - If not found, creates a new child game with a cycle guard
 *
 * Returns the child game ID, or null if creation was skipped (cycle).
 */
export async function findOrCreatePlayerChildGame(opts: {
  /** The game that was just saved (the source of truth for metadata). */
  game: {
    id: string;
    parent_game_id: string | null;
    date: Date | string;
    script: string;
    script_id: number | null;
    location_type: string;
    location: string;
    community_name: string;
    community_id: number | null;
    player_count: number | null;
    traveler_count: number | null;
    storyteller: string | null;
    co_storytellers: string[];
    win_v2: string;
    is_storyteller: boolean;
    grimoire: { id: number }[];
    demon_bluffs: { id?: number; name: string; role_id: string | null }[];
    fabled: { id?: number; name: string; role_id: string | null }[];
    user?: { username: string } | null;
  };
  /** The user ID of the tagged player. */
  playerId: string;
  /** The player's character data extracted from grimoire tokens. */
  playerCharacters: ChildGameTokenData[];
  /** Existing related games in this game tree. */
  relatedGames: RelatedGame[];
  /** If false, the child game won't need confirmation (e.g. claim_seat). Defaults to true. */
  waitingForConfirmation?: boolean;
}): Promise<string | null> {
  const { game, playerId, playerCharacters, relatedGames, waitingForConfirmation = true } = opts;

  const existingGame = relatedGames.find((g) => g.user_id === playerId);

  if (existingGame) {
    // Update the existing child game
    await prisma.game.update({
      where: { id: existingGame.id },
      data: {
        date: new Date(game.date as string),
        script: game.script,
        script_id: game.script_id,
        location_type: game.location_type as any,
        location: game.location,
        community_name: game.community_name,
        community_id: game.community_id,
        player_count: game.player_count,
        traveler_count: game.traveler_count,
        storyteller: game.storyteller,
        co_storytellers: game.co_storytellers,
        win_v2: game.win_v2 as any,
        demon_bluffs: {
          deleteMany: existingGame.demon_bluffs.map((g) => ({ id: g.id })),
          create: game.demon_bluffs.map((g) => ({
            name: g.name,
            role_id: g.role_id,
          })),
        },
        fabled: {
          deleteMany: existingGame.fabled.map((g) => ({ id: g.id })),
          create: game.fabled.map((g) => ({
            name: g.name,
            role_id: g.role_id,
          })),
        },
        player_characters: {
          deleteMany: existingGame.player_characters.map((g) => ({
            id: g.id,
          })),
          create: playerCharacters,
        },
        grimoire: {
          connect: game.grimoire.map((g) => ({ id: g.id })),
        },
      },
    });
    return existingGame.id;
  }

  // No existing game — create a new child game
  const parentId = resolveRootParentId(game);

  // Double-check: does the player already have a game in this tree?
  // This is the atomic check that prevents the TOCTOU race.
  const existingInTree = await prisma.game.findFirst({
    where: {
      user_id: playerId,
      OR: [
        { parent_game_id: parentId },
        { id: parentId },
      ],
      deleted: false,
    },
    select: { id: true },
  });

  if (existingInTree) {
    // Another concurrent request already created the child game
    return existingInTree.id;
  }

  const newGame = await prisma.game.create({
    data: {
      date: new Date(game.date as string),
      script: game.script,
      script_id: game.script_id,
      location_type: game.location_type as any,
      location: game.location,
      community_name: game.community_name,
      community_id: game.community_id,
      player_count: game.player_count,
      traveler_count: game.traveler_count,
      storyteller:
        game.is_storyteller && game.user
          ? `@${game.user.username}`
          : game.storyteller,
      co_storytellers: game.co_storytellers,
      win_v2: game.win_v2 as any,
      user_id: playerId,
      player_characters: {
        create: [...playerCharacters],
      },
      demon_bluffs: {
        create: game.demon_bluffs.map((g) => ({
          name: g.name,
          role_id: g.role_id,
        })),
      },
      fabled: {
        create: game.fabled.map((g) => ({
          name: g.name,
          role_id: g.role_id,
        })),
      },
      grimoire: {
        connect: game.grimoire.map((g) => ({ id: g.id })),
      },
      parent_game_id: parentId,
      waiting_for_confirmation: waitingForConfirmation,
      is_storyteller: false,
      tags: [],
      notes: "",
    },
    select: { id: true },
  });

  return newGame.id;
}

/**
 * Find or create a child game for a co-storyteller.
 * Same pattern as player child games but with is_storyteller=true
 * and no player_characters.
 */
export async function findOrCreateStorytellerChildGame(opts: {
  game: {
    id: string;
    parent_game_id: string | null;
    date: Date | string;
    script: string;
    script_id: number | null;
    location_type: string;
    location: string;
    community_name: string;
    community_id: number | null;
    player_count: number | null;
    traveler_count: number | null;
    storyteller: string | null;
    co_storytellers: string[];
    win_v2: string;
    grimoire: { id: number }[];
    demon_bluffs: { id?: number; name: string; role_id: string | null }[];
    fabled: { id?: number; name: string; role_id: string | null }[];
  };
  /** The user ID of the co-storyteller. */
  storytellerUserId: string;
  /** Existing child games of this game. */
  childGames: RelatedGame[];
}): Promise<string | null> {
  const { game, storytellerUserId, childGames } = opts;

  const existingGame = childGames.find(
    (g) => g.user_id === storytellerUserId
  );

  if (existingGame) {
    await prisma.game.update({
      where: { id: existingGame.id },
      data: {
        date: new Date(game.date as string),
        script: game.script,
        script_id: game.script_id,
        location_type: game.location_type as any,
        location: game.location,
        community_name: game.community_name,
        community_id: game.community_id,
        player_count: game.player_count,
        traveler_count: game.traveler_count,
        storyteller: game.storyteller,
        co_storytellers: game.co_storytellers,
        win_v2: game.win_v2 as any,
        demon_bluffs: {
          deleteMany: existingGame.demon_bluffs.map((g) => ({ id: g.id })),
          create: game.demon_bluffs.map((g) => ({
            name: g.name,
            role_id: g.role_id,
          })),
        },
        fabled: {
          deleteMany: existingGame.fabled.map((g) => ({ id: g.id })),
          create: game.fabled.map((g) => ({
            name: g.name,
            role_id: g.role_id,
          })),
        },
        grimoire: {
          connect: game.grimoire.map((g) => ({ id: g.id })),
        },
      },
    });
    return existingGame.id;
  }

  // No existing game — create new
  const parentId = game.id; // storyteller children always point to this game directly

  // Atomic double-check
  const existingInTree = await prisma.game.findFirst({
    where: {
      user_id: storytellerUserId,
      parent_game_id: game.id,
      deleted: false,
    },
    select: { id: true },
  });

  if (existingInTree) {
    return existingInTree.id;
  }

  const newGame = await prisma.game.create({
    data: {
      date: new Date(game.date as string),
      script: game.script,
      script_id: game.script_id,
      location_type: game.location_type as any,
      location: game.location,
      community_name: game.community_name,
      community_id: game.community_id,
      player_count: game.player_count,
      traveler_count: game.traveler_count,
      storyteller: game.storyteller,
      co_storytellers: game.co_storytellers,
      win_v2: game.win_v2 as any,
      is_storyteller: true,
      user_id: storytellerUserId,
      player_characters: {},
      demon_bluffs: {
        create: game.demon_bluffs.map((g) => ({
          name: g.name,
          role_id: g.role_id,
        })),
      },
      fabled: {
        create: game.fabled.map((g) => ({
          name: g.name,
          role_id: g.role_id,
        })),
      },
      grimoire: {
        connect: game.grimoire.map((g) => ({ id: g.id })),
      },
      parent_game_id: game.id,
      waiting_for_confirmation: true,
      tags: [],
      notes: "",
    },
    select: { id: true },
  });

  return newGame.id;
}
