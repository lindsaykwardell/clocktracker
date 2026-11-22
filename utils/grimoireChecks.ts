/**
 * Checks for grimoires that look wrong: seats that moved between pages, a
 * seat whose name changed, the same player on two seats. Used by the admin
 * debug dialog on the games page.
 *
 * To add a check, write a GrimoireCheckRule and add it to
 * GRIMOIRE_CHECK_RULES. A rule gets one game and returns what it found; the
 * dialog shows the rule's label next to each finding and lets you filter by
 * rule.
 *
 * The rules only read what the games list already loads, so this runs in the
 * browser. Seat ids (grimoire_participant_id) are not used: for older games
 * they were filled in afterwards from the seat number, so they can't show
 * that a seat moved.
 */

export type GrimoireCheckToken = {
  order: number;
  player_name: string | null;
  player_id: string | null;
  role_id: string | null;
  alignment: string | null;
  role?: { name: string } | null;
  player?: { username: string; display_name?: string | null } | null;
};

export type GrimoireCheckGame = {
  script?: string | null;
  grimoire: { tokens: GrimoireCheckToken[] }[];
};

export type GrimoireCheckFinding = {
  rule: string;
  /** The page (1-based) where the problem shows; for a change, the later page. */
  page: number;
  message: string;
};

export type GrimoireCheckRule = {
  id: string;
  label: string;
  /** One line for the dialog: what the rule looks for. */
  description: string;
  check: (game: GrimoireCheckGame) => GrimoireCheckFinding[];
};

// Characters that legitimately move players to other seats.
const SEAT_MOVING_ROLES = new Set(["matron"]);

// Scripts where players move seats as part of the game (lowercase; matched
// anywhere in the script name, so versions and suffixes still match).
// Musical Chairs: players change seats at will.
const SEAT_MOVING_SCRIPTS = ["musical chairs"];

function isSeatMovingScript(script: string | null | undefined) {
  const name = (script ?? "").toLowerCase();
  return SEAT_MOVING_SCRIPTS.some((moving) => name.includes(moving));
}

function cleanName(name: string | null | undefined) {
  return (name ?? "").trim().replace(/^@/, "");
}

/** How a seat's player is shown in a message: the name, marked when linked. */
function describePlayer(token: GrimoireCheckToken) {
  const name = cleanName(token.player_name) || cleanName(token.player?.username);
  if (!name) return "(no name)";
  return token.player_id ? `"${name}" (linked)` : `"${name}"`;
}

/**
 * Who sits on a seat, for comparing seats between pages: the linked user, or
 * the typed name. Null for an empty seat.
 */
export function playerKey(token: GrimoireCheckToken): string | null {
  if (token.player_id) return `user:${token.player_id}`;
  const name = cleanName(token.player_name).toLowerCase();
  return name ? `name:${name}` : null;
}

/** Whether a typed name is the linked user's name, so linking it is the only change. */
function sameNameAsLinked(typed: GrimoireCheckToken, linked: GrimoireCheckToken) {
  const name = cleanName(typed.player_name).toLowerCase();
  if (!name) return false;
  const names = [linked.player_name, linked.player?.username, linked.player?.display_name]
    .map((n) => cleanName(n).toLowerCase())
    .filter(Boolean);
  return names.includes(name);
}

/** A token with its place around the circle (0-based). */
type SeatedToken = GrimoireCheckToken & { seat: number };

/**
 * The pages, with each token's seat: its place after sorting by `order`, the
 * way the grimoire draws it. The stored numbers can have gaps or repeats
 * (older games), so two pages can store different numbers for the same
 * place; comparing the places avoids reporting those as moved seats.
 */
function pages(game: GrimoireCheckGame): { tokens: SeatedToken[] }[] {
  return (game.grimoire ?? []).map((page) => ({
    tokens: page.tokens
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((token, seat) => ({ ...token, seat })),
  }));
}

function bySeat(tokens: SeatedToken[]) {
  const map = new Map<number, SeatedToken>();
  for (const token of tokens) map.set(token.seat, token);
  return map;
}

function duplicateKeys(tokens: GrimoireCheckToken[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const token of tokens) {
    const key = playerKey(token);
    if (!key) continue;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
}

/** A player sits on a different seat on the next page. */
export const seatsShifted: GrimoireCheckRule = {
  id: "seats-shifted",
  label: "Seats shifted",
  description:
    "A player sits on another seat on the next page, while the number of seats stayed the same, no Matron is in the game and the script isn't Musical Chairs.",
  check(game) {
    const all = pages(game);
    const hasSeatMover = all.some((page) =>
      page.tokens.some((token) => token.role_id && SEAT_MOVING_ROLES.has(token.role_id))
    );
    if (hasSeatMover || isSeatMovingScript(game.script)) return [];

    const findings: GrimoireCheckFinding[] = [];
    for (let i = 1; i < all.length; i++) {
      const before = all[i - 1].tokens;
      const after = all[i].tokens;
      // A Traveller joining or leaving changes the seats; not a shift.
      if (before.length !== after.length) continue;

      // A name on two seats can't say which one moved; "Same player twice"
      // reports those.
      const duplicates = new Set([...duplicateKeys(before), ...duplicateKeys(after)]);

      const seatBefore = new Map<string, SeatedToken>();
      for (const token of before) {
        const key = playerKey(token);
        if (key) seatBefore.set(key, token);
      }

      const moved: string[] = [];
      for (const token of after) {
        const key = playerKey(token);
        const previous = key && !duplicates.has(key) ? seatBefore.get(key) : undefined;
        if (previous && previous.seat !== token.seat) {
          moved.push(`${describePlayer(token)} seat ${previous.seat + 1} → ${token.seat + 1}`);
        }
      }
      if (moved.length) {
        findings.push({
          rule: seatsShifted.id,
          page: i + 1,
          message: `Page ${i} → ${i + 1}: ${moved.length} moved (${moved.join(", ")})`,
        });
      }
    }
    return findings;
  },
};

/** The same seat, character and alignment, but another name. */
export const nameChanged: GrimoireCheckRule = {
  id: "name-changed",
  label: "Name changed",
  description:
    "A seat keeps its character and alignment on the next page, but the name on it is different, removed, or only linked from that page on.",
  check(game) {
    const all = pages(game);
    const findings: GrimoireCheckFinding[] = [];
    for (let i = 1; i < all.length; i++) {
      const before = bySeat(all[i - 1].tokens);
      for (const token of all[i].tokens) {
        const previous = before.get(token.seat);
        if (!previous) continue;
        if (previous.role_id !== token.role_id || previous.alignment !== token.alignment) continue;
        const keyBefore = playerKey(previous);
        const keyAfter = playerKey(token);
        if (keyBefore === keyAfter) continue;

        let kind: string;
        if (!keyAfter) kind = "name removed";
        else if (!keyBefore) kind = "name added";
        else if (!previous.player_id && token.player_id && sameNameAsLinked(previous, token))
          kind = "linked from this page on";
        else if (previous.player_id && !token.player_id && sameNameAsLinked(token, previous))
          kind = "unlinked";
        else kind = "different name";

        const character = token.role?.name ? ` (${token.role.name})` : "";
        findings.push({
          rule: nameChanged.id,
          page: i + 1,
          message: `Page ${i} → ${i + 1}: seat ${token.seat + 1}${character} ${describePlayer(previous)} → ${describePlayer(token)}, ${kind}`,
        });
      }
    }
    return findings;
  },
};

/** One player on two seats of the same page. */
export const duplicatePlayer: GrimoireCheckRule = {
  id: "duplicate-player",
  label: "Same player twice",
  description: "The same name or linked user sits on two seats of one page.",
  check(game) {
    // The same duplicate usually repeats on every page: one finding for it,
    // listing the pages.
    const found = new Map<string, { player: string; seats: string; pages: number[] }>();
    pages(game).forEach((page, index) => {
      const seats = new Map<string, SeatedToken[]>();
      for (const token of page.tokens) {
        const key = playerKey(token);
        if (!key) continue;
        seats.set(key, [...(seats.get(key) ?? []), token]);
      }
      for (const [key, tokens] of seats) {
        if (tokens.length < 2) continue;
        const seatList = tokens.map((token) => token.seat + 1).join(", ");
        const id = `${key}|${seatList}`;
        const entry = found.get(id) ?? { player: describePlayer(tokens[0]), seats: seatList, pages: [] };
        entry.pages.push(index + 1);
        found.set(id, entry);
      }
    });
    return [...found.values()].map((entry) => ({
      rule: duplicatePlayer.id,
      page: entry.pages[0],
      message: `${entry.pages.length === 1 ? "Page" : "Pages"} ${entry.pages.join(", ")}: ${entry.player} on seats ${entry.seats}`,
    }));
  },
};

export const GRIMOIRE_CHECK_RULES: GrimoireCheckRule[] = [seatsShifted, nameChanged, duplicatePlayer];

/** Runs the rules on one game; an empty list means nothing looked wrong. */
export function checkGrimoire(
  game: GrimoireCheckGame,
  rules: GrimoireCheckRule[] = GRIMOIRE_CHECK_RULES
): GrimoireCheckFinding[] {
  return rules.flatMap((rule) => rule.check(game));
}
