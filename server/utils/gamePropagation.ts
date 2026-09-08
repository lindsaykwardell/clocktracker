import { Alignment, GrimoireEvent, GrimoireEventType } from "~/server/generated/prisma/client";

// Shared by games.post.ts, games/[id].put.ts, and games.put.ts, which all
// need to map a game's grimoire_events onto a nested Prisma create() input
// the same way (previously duplicated inline in each of the three files).
export function mapGrimoireEventsForCreate(events: GrimoireEvent[]) {
  return events.map((grimoireEvent) => ({
    grimoire_page: grimoireEvent.grimoire_page,
    participant_id: grimoireEvent.participant_id,
    event_type: grimoireEvent.event_type ?? GrimoireEventType.NOT_RECORDED,
    cause: grimoireEvent.cause ?? null,
    by_participant_id: grimoireEvent.by_participant_id ?? null,
    player_name: grimoireEvent.player_name ?? "",
    role_id: grimoireEvent.role_id ?? null,
    by_role_id: grimoireEvent.by_role_id ?? null,
    old_role_id: (grimoireEvent as any).old_role_id ?? null,
    new_role_id: (grimoireEvent as any).new_role_id ?? null,
    old_alignment: (grimoireEvent as any).old_alignment ?? null,
    new_alignment: (grimoireEvent as any).new_alignment ?? null,
    status_source: (grimoireEvent as any).status_source ?? null,
  }));
}

type TokenLike = {
  player_id: string | null;
  role_id: string | null;
  related_role_id: string | null;
  alignment: Alignment;
  role?: { name: string } | null;
  related_role?: { name: string } | null;
};

type GrimoireLike = {
  tokens?: TokenLike[] | null;
};

// Every game write endpoint needs the set of player ids tagged anywhere in
// the game's grimoire (to propagate a copy of the game to each of them).
export function getTaggedPlayerIds(
  grimoire: GrimoireLike[],
  excludeUserId: string,
): string[] {
  const ids = new Set(
    grimoire.flatMap((g) => g.tokens?.map((t) => t.player_id) ?? []),
  );
  return [...ids].filter((id): id is string => !!id && id !== excludeUserId);
}

export type PropagatedPlayerCharacter = {
  name: string;
  alignment: Alignment;
  related: string;
  role_id: string | null;
  related_role_id: string | null;
};

// Reduces a game's grimoire down to the ordered, de-duplicated list of
// characters a single tagged player held over the course of the game, for
// use as that player's own player_characters when the game is propagated
// to their account.
export function buildPlayerCharactersForToken(
  grimoire: GrimoireLike[],
  playerId: string,
): PropagatedPlayerCharacter[] {
  return grimoire.reduce((acc, g) => {
    const tokens = g.tokens?.filter((t) => t.player_id === playerId);
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
  }, [] as PropagatedPlayerCharacter[]);
}
