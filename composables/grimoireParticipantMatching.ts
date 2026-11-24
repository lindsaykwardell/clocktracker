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
 * A page's tokens in seat order. Sorted by `order`, and by their place in the
 * list when two share one (some old pages store the same order twice), so the
 * seat is the token's position here, not its raw `order`.
 */
function seated<T extends ParticipantMatchToken>(tokens: T[]): T[] {
  return tokens
    .map((token, index) => ({ token, index }))
    .sort((a, b) => a.token.order - b.token.order || a.index - b.index)
    .map(({ token }) => token);
}

/**
 * Links each token on a page to the token it continues on the previous page:
 * the same player, who may have moved seat or changed character. Tokens with
 * no link are new (a traveller who joined, say).
 *
 * Done for the whole page at once, strongest evidence first, so a weak guess
 * for one seat can't take the token a later seat matches for certain:
 *
 * 1. The same player account.
 * 2. The same player name.
 * 3. The same participant id (from an earlier save), unless the two tokens
 *    have different player names.
 * 4. Unnamed seats. With the same number of seats on both pages, the same
 *    seat first and then the same character: players rarely change seats,
 *    while characters change all the time (Barber, Pit-Hag, Snake Charmer),
 *    so a swapped pair of characters is two character changes, not two seat
 *    changes. When the number of seats changed (a traveller joined or left),
 *    the seats shift, so the character comes first, nearest seat winning.
 *
 * Empty seats (no character) are never linked by character, and two tokens
 * with different player names are never linked at all.
 */
export function matchPageTokens<T extends ParticipantMatchToken>(
  previousTokens: T[],
  currentTokens: T[]
): Map<T, T> {
  const previous = seated(previousTokens);
  const current = seated(currentTokens);
  const previousSeat = new Map(previous.map((token, seat) => [token, seat]));
  const currentSeat = new Map(current.map((token, seat) => [token, seat]));

  const matches = new Map<T, T>();
  const claimed = new Set<T>();

  const nameOf = (token: T) => normalizePlayerName(token.player_name);
  const namesConflict = (a: T, b: T) => {
    const nameA = nameOf(a);
    const nameB = nameOf(b);
    return !!nameA && !!nameB && nameA !== nameB;
  };
  const distance = (token: T, candidate: T) =>
    Math.abs((currentSeat.get(token) ?? 0) - (previousSeat.get(candidate) ?? 0));

  /** For each unlinked token, the closest unclaimed candidate that passes `accepts`. */
  function linkBy(accepts: (token: T, candidate: T) => boolean) {
    for (const token of current) {
      if (matches.has(token)) continue;
      let best: T | null = null;
      for (const candidate of previous) {
        if (claimed.has(candidate) || namesConflict(token, candidate)) continue;
        if (!accepts(token, candidate)) continue;
        if (!best || distance(token, candidate) < distance(token, best)) best = candidate;
      }
      if (best) {
        matches.set(token, best);
        claimed.add(best);
      }
    }
  }

  const samePlayer = (token: T, candidate: T) =>
    !!token.player_id && token.player_id === candidate.player_id;
  const sameName = (token: T, candidate: T) =>
    !!nameOf(token) && nameOf(token) === nameOf(candidate);
  const sameParticipant = (token: T, candidate: T) =>
    !!token.grimoire_participant_id &&
    token.grimoire_participant_id === candidate.grimoire_participant_id;
  const sameSeat = (token: T, candidate: T) =>
    currentSeat.get(token) === previousSeat.get(candidate);
  const sameCharacter = (token: T, candidate: T) =>
    !!token.role_id && token.role_id === candidate.role_id;

  linkBy(samePlayer);
  // Two players with the same name: the same participant id, else the nearest seat.
  linkBy((token, candidate) => sameName(token, candidate) && sameParticipant(token, candidate));
  linkBy(sameName);
  linkBy(sameParticipant);

  if (previous.length === current.length) {
    linkBy(sameSeat);
    linkBy(sameCharacter);
    // Whoever is left took a seat someone else left: pair them up by distance.
    linkBy(() => true);
  } else {
    linkBy(sameCharacter);
    linkBy(sameSeat);
  }

  return matches;
}

/**
 * The one item that moved when `after` is `before` with a single item taken
 * out and put back elsewhere (one player moving several seats shifts everyone
 * in between by one). Null when it isn't exactly one such move.
 */
function singleMove<X>(before: X[], after: X[]): X | null {
  if (before.length !== after.length || before.length === 0) return null;
  if (before.every((item, index) => item === after[index])) return null;

  let found: X | null = null;
  for (let from = 0; from < before.length; from += 1) {
    const moved = before[from];
    const without = before.slice(0, from).concat(before.slice(from + 1));
    for (let to = 0; to <= without.length; to += 1) {
      const candidate = without.slice(0, to).concat([moved], without.slice(to));
      if (candidate.every((item, index) => item === after[index])) {
        if (found && found !== moved) return null;
        found = moved;
      }
    }
  }
  return found;
}

/**
 * The tokens on a page whose player changed seat since the previous page,
 * given `matches` from matchPageTokens.
 *
 * - Seats are compared among the players on both pages only, so a seat
 *   added or removed partway (rare: traveller seats are usually reserved from
 *   the start) shifts nobody.
 * - A player who turns up in another seat changed seat, whether or not their
 *   character went with them (Musical Chairs is both a seat and a character
 *   change). Seat changes are rare, so they also show up storyteller mistakes.
 * - One player moving several seats is one seat change, not one for everyone
 *   they passed.
 */
export function seatMoves<T extends ParticipantMatchToken>(
  previousTokens: T[],
  currentTokens: T[],
  matches: Map<T, T>
): Set<T> {
  const continuingPrevious = new Set(matches.values());
  const previous = seated(previousTokens).filter((token) => continuingPrevious.has(token));
  const current = seated(currentTokens).filter((token) => matches.has(token));

  const previousRank = new Map(previous.map((token, rank) => [token, rank]));
  const moved = current.filter(
    (token, rank) => previousRank.get(matches.get(token)!) !== rank
  );
  if (moved.length <= 1) return new Set(moved);

  const onlyMover = singleMove(
    previous,
    current.map((token) => matches.get(token)!)
  );
  if (!onlyMover) return new Set(moved);
  return new Set(moved.filter((token) => matches.get(token) === onlyMover));
}

/**
 * The token on the previous page that `token` continues, or null on the first
 * page and for a new participant. `token` is a token of page `pageIndex`, or a
 * copy of one (found by participant id, then seat).
 */
export function findMatchingTokenOnPreviousPage<T extends ParticipantMatchToken>(
  grimoirePages: ParticipantMatchPage<T>[],
  pageIndex: number,
  token: ParticipantMatchToken
): T | null {
  if (pageIndex <= 0) return null;
  const page = grimoirePages[pageIndex];
  const previousPage = grimoirePages[pageIndex - 1];
  if (!page || !previousPage) return null;

  const own =
    page.tokens.find((candidate) => candidate === token) ??
    (token.grimoire_participant_id
      ? page.tokens.find(
          (candidate) => candidate.grimoire_participant_id === token.grimoire_participant_id
        )
      : undefined) ??
    page.tokens.find((candidate) => candidate.order === token.order);
  if (!own) return null;

  return matchPageTokens(previousPage.tokens, page.tokens).get(own) ?? null;
}

/**
 * Gives every token a participant id, the one of the token it continues on
 * the previous page (see matchPageTokens), and makes sure no two tokens on a
 * page share one. Returns the tokens whose id was set or changed.
 *
 * - `keepExisting: true` (the background fill): a token that has an id keeps
 *   it, since stored events point at it; only missing ids are filled in.
 * - `keepExisting: false` (the editor): ids follow the matching, so a token
 *   takes over the id of the token it continues even if it had another one.
 */
export function assignParticipantIds<T extends ParticipantMatchToken>(
  grimoirePages: ParticipantMatchPage<T>[],
  options: { keepExisting: boolean }
): T[] {
  const changed: T[] = [];

  grimoirePages.forEach((page, pageIndex) => {
    const tokens = seated(page.tokens);
    const previousPage = pageIndex > 0 ? grimoirePages[pageIndex - 1] : null;
    const matches = previousPage
      ? matchPageTokens(previousPage.tokens, page.tokens)
      : new Map<T, T>();
    const inherited = (token: T) => matches.get(token)?.grimoire_participant_id ?? null;

    const decided = new Map<T, string>();
    const used = new Set<string>();
    const take = (token: T, id: string | null | undefined) => {
      if (!id || used.has(id) || decided.has(token)) return;
      decided.set(token, id);
      used.add(id);
    };

    if (options.keepExisting) {
      for (const token of tokens) take(token, token.grimoire_participant_id);
      for (const token of tokens) take(token, inherited(token));
    } else {
      for (const token of tokens) take(token, inherited(token));
      for (const token of tokens) take(token, token.grimoire_participant_id);
    }

    for (const token of tokens) {
      const id = decided.get(token) ?? createParticipantId();
      if (token.grimoire_participant_id !== id) {
        token.grimoire_participant_id = id;
        changed.push(token);
      }
    }
  });

  return changed;
}
