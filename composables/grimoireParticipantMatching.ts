export type ParticipantMatchToken = {
  order: number;
  grimoire_participant_id?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  role_id?: string | null;
  is_dead?: boolean;
};

export type ParticipantMatchPage<T extends ParticipantMatchToken = ParticipantMatchToken> = {
  tokens: T[];
};

/**
 * Normalizes player names so matching stays stable across pages and events.
 */
export function normalizePlayerName(name?: string | null) {
  return (name || "").trim().toLowerCase();
}

/**
 * Generates a stable participant id for tokens that do not have one yet.
 */
export function createParticipantId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Finds the most likely matching token on the previous page for a current-page token,
 * because seat moves, role changes, and traveler joins can break simple order-based matching.
 */
export function findMatchingTokenOnPreviousPage<T extends ParticipantMatchToken>(
  grimoirePages: ParticipantMatchPage<T>[],
  pageIndex: number,
  token: {
    order: number;
    grimoire_participant_id?: string | null;
    player_id?: string | null;
    player_name?: string | null;
    role_id?: string | null;
  },
  usedPreviousOrders?: Set<number>,
  preferPreviousDead?: boolean | null
) {
  if (pageIndex <= 0) return null;
  const previousPage = grimoirePages[pageIndex - 1];
  if (!previousPage) return null;

  const available = previousPage.tokens.filter(
    (candidate) => !usedPreviousOrders?.has(candidate.order)
  );

  if (token.grimoire_participant_id) {
    const byParticipantId =
      available.find(
        (candidate) =>
          candidate.grimoire_participant_id === token.grimoire_participant_id
      ) || null;
    if (byParticipantId) {
      usedPreviousOrders?.add(byParticipantId.order);
      return byParticipantId;
    }
  }

  if (token.player_id) {
    const byPlayerId =
      available.find((candidate) => candidate.player_id === token.player_id) || null;
    if (byPlayerId) {
      usedPreviousOrders?.add(byPlayerId.order);
      return byPlayerId;
    }
  }

  const tokenName = normalizePlayerName(token.player_name);
  if (tokenName) {
    const byName = available.filter(
      (candidate) => normalizePlayerName(candidate.player_name) === tokenName
    );
    if (byName.length > 0) {
      const preferredByState =
        preferPreviousDead === null || preferPreviousDead === undefined
          ? null
          : byName.find((candidate) => candidate.is_dead === preferPreviousDead);
      const preferred =
        preferredByState ||
        byName.find((candidate) => candidate.order === token.order) ||
        byName[0];
      usedPreviousOrders?.add(preferred.order);
      return preferred;
    }
  }

  if (token.role_id) {
    const byRole = available.filter((candidate) => candidate.role_id === token.role_id);
    if (byRole.length > 0) {
      const preferredByState =
        preferPreviousDead === null || preferPreviousDead === undefined
          ? null
          : byRole.find((candidate) => candidate.is_dead === preferPreviousDead);
      const preferred =
        preferredByState ||
        byRole.find((candidate) => candidate.order === token.order) ||
        byRole[0];
      usedPreviousOrders?.add(preferred.order);
      return preferred;
    }
  }

  const byOrder = available.find((candidate) => candidate.order === token.order) || null;
  if (byOrder) {
    usedPreviousOrders?.add(byOrder.order);
  }
  return byOrder;
}
