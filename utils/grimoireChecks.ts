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
  grimoire_participant_id?: string | null;
};

export type GrimoireCheckEvent = {
  grimoire_page: number;
  participant_id: string;
  event_type: string;
  cause: string | null;
  by_participant_id: string | null;
  by_role_id: string | null;
  player_name: string;
  role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: string | null;
  new_alignment: string | null;
};

export type GrimoireCheckGame = {
  script?: string | null;
  grimoire: { tokens: GrimoireCheckToken[] }[];
  grimoire_events?: GrimoireCheckEvent[];
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
  /** For a game's findings: "Name changes: 8". Defaults to the label. */
  plural?: string;
  /** One line for the dialog: what the rule looks for. */
  description: string;
  /** Off when the dialog opens (for rules that would list nearly every game). */
  offByDefault?: boolean;
  check: (game: GrimoireCheckGame) => GrimoireCheckFinding[];
};

// Characters that legitimately move players to other seats.
export const SEAT_MOVING_ROLES = new Set(["matron"]);

// Scripts where players move seats as part of the game (lowercase; matched
// anywhere in the script name, so versions and suffixes still match).
// Musical Chairs: players change seats at will.
const SEAT_MOVING_SCRIPTS = ["musical chairs"];

export function isSeatMovingScript(script: string | null | undefined) {
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
  label: "Name change",
  plural: "Name changes",
  description:
    "A seat keeps its character and alignment on the next page, but the name on it is different, removed, or only linked from that page on, and the script isn't Musical Chairs.",
  check(game) {
    // In Musical Chairs players move between seats, so names come and go on
    // a seat while its character stays.
    if (isSeatMovingScript(game.script)) return [];
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
  label: "Duplicate name",
  plural: "Duplicate names",
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

/**
 * A page that stores the same seat number twice, or skips one. The grimoire
 * draws it sorted, so a player can land in the wrong seat. The background
 * fill repairs these from the neighbouring pages when it can; this lists the
 * ones still left (and those of games the fill hasn't reached yet).
 */
export const brokenSeatNumbers: GrimoireCheckRule = {
  id: "broken-seat-numbers",
  label: "Incorrect seat numbers",
  description:
    "A page stores the same seat number twice or skips one, so a player may be placed in the wrong seat. Check the seats on that page and save.",
  check(game) {
    const findings: GrimoireCheckFinding[] = [];
    (game.grimoire ?? []).forEach((page, index) => {
      const counts = new Map<number, number>();
      for (const token of page.tokens) counts.set(token.order, (counts.get(token.order) ?? 0) + 1);
      const twice = [...counts].filter(([, count]) => count > 1).map(([order]) => order + 1);
      const missing: number[] = [];
      for (let seat = 0; seat < page.tokens.length; seat += 1) {
        if (!counts.has(seat)) missing.push(seat + 1);
      }
      if (!twice.length && !missing.length) return;
      const parts = [
        ...twice.map((seat) => `seat ${seat} twice`),
        ...(missing.length ? [`no seat ${missing.join(", ")}`] : []),
      ];
      findings.push({
        rule: brokenSeatNumbers.id,
        page: index + 1,
        message: `Page ${index + 1}: ${parts.join(", ")}`,
      });
    });
    return findings;
  },
};

export const GRIMOIRE_CHECK_RULES: GrimoireCheckRule[] = [
  nameChanged,
  duplicatePlayer,
  seatsShifted,
  brokenSeatNumbers,
];

/** Runs the rules on one game; an empty list means nothing looked wrong. */
export function checkGrimoire(
  game: GrimoireCheckGame,
  rules: GrimoireCheckRule[] = GRIMOIRE_CHECK_RULES
): GrimoireCheckFinding[] {
  return rules.flatMap((rule) => rule.check(game));
}

/*
 * Grimoire events that aren't filled in. Not mistakes: a death the
 * storyteller didn't record the cause of, or a change without the character
 * that caused it. They are listed so the ones that can still be filled in
 * (a Barber swap, a Snake Charmer jump) are easy to find.
 */

export type GrimoireEventKind = "death" | "change" | "other";

const EVENT_KINDS: Record<string, GrimoireEventKind> = {
  NOT_RECORDED: "death",
  DEATH: "death",
  EXECUTION: "death",
  ROLE_CHANGE: "change",
  ALIGNMENT_CHANGE: "change",
  SEAT_CHANGE: "change",
  REVIVE: "other",
  MAD: "other",
  DRUNK: "other",
  POISONED: "other",
  OTHER: "other",
};

export function eventKind(event: GrimoireCheckEvent): GrimoireEventKind {
  return EVENT_KINDS[event.event_type] ?? "other";
}

/**
 * Whether an event is missing what caused it. A death: it isn't known how
 * (Not recorded, or a death without a cause or a character). An execution
 * needs nothing more. Anything else: no character or player caused it. Seat
 * changes in a game where players move seats themselves (Musical Chairs)
 * have no cause to fill in.
 */
export function isUnfilledEvent(event: GrimoireCheckEvent, script?: string | null) {
  const hasSource = !!event.by_role_id || !!event.by_participant_id;
  switch (event.event_type) {
    case "NOT_RECORDED":
      return true;
    case "DEATH":
      return !event.cause && !hasSource;
    case "EXECUTION":
      return false;
    case "SEAT_CHANGE":
      return !hasSource && !isSeatMovingScript(script);
    default:
      return !hasSource;
  }
}

/**
 * A game's events that aren't filled in. In Musical Chairs a player who
 * changes seats takes that seat's character, so a character or alignment
 * change on the same page as the player's seat change is caused by the move.
 */
export function unfilledEvents(game: GrimoireCheckGame): GrimoireCheckEvent[] {
  const events = game.grimoire_events ?? [];
  const moved = new Set(
    isSeatMovingScript(game.script)
      ? events
          .filter((event) => event.event_type === "SEAT_CHANGE")
          .map((event) => `${event.grimoire_page}:${event.participant_id}`)
      : []
  );
  return events.filter((event) => {
    if (
      (event.event_type === "ROLE_CHANGE" || event.event_type === "ALIGNMENT_CHANGE") &&
      moved.has(`${event.grimoire_page}:${event.participant_id}`)
    ) {
      return false;
    }
    return isUnfilledEvent(event, game.script);
  });
}

/**
 * "steven.d" (Barber): the player on that page, or the name the event kept.
 * Without the character for a character change, which says it already.
 */
function describeEventPlayer(game: GrimoireCheckGame, event: GrimoireCheckEvent, withRole = true) {
  const token = game.grimoire?.[event.grimoire_page]?.tokens.find(
    (candidate) =>
      !!event.participant_id && candidate.grimoire_participant_id === event.participant_id
  );
  const name = cleanName(token?.player_name) || cleanName(token?.player?.username) || cleanName(event.player_name);
  const role = withRole ? token?.role?.name : null;
  if (!name) return role ? `(no name, ${role})` : "(no name)";
  return role ? `"${name}" (${role})` : `"${name}"`;
}

function roleNames(game: GrimoireCheckGame) {
  const names = new Map<string, string>();
  for (const page of game.grimoire ?? []) {
    for (const token of page.tokens) {
      if (token.role_id && token.role?.name) names.set(token.role_id, token.role.name);
    }
  }
  return (id: string | null) => (id ? names.get(id) ?? id : "?");
}

const ALIGNMENT_NAMES: Record<string, string> = { GOOD: "Good", EVIL: "Evil", NEUTRAL: "Neutral" };

const EVENT_VERBS: Record<string, string> = {
  NOT_RECORDED: "died",
  DEATH: "died",
  REVIVE: "revived",
  MAD: "mad",
  DRUNK: "drunk",
  POISONED: "poisoned",
  OTHER: "other event",
};

function describeEvent(game: GrimoireCheckGame, event: GrimoireCheckEvent, role: (id: string | null) => string) {
  const player = describeEventPlayer(game, event, event.event_type !== "ROLE_CHANGE");
  switch (event.event_type) {
    case "ROLE_CHANGE":
      return `${player} ${role(event.old_role_id)} → ${role(event.new_role_id)}`;
    case "ALIGNMENT_CHANGE":
      return `${player} ${ALIGNMENT_NAMES[event.old_alignment ?? ""] ?? "?"} → ${ALIGNMENT_NAMES[event.new_alignment ?? ""] ?? "?"}`;
    case "SEAT_CHANGE":
      return `${player} changed seats`;
    default:
      return `${player} ${EVENT_VERBS[event.event_type] ?? event.event_type.toLowerCase()}`;
  }
}

function unfilledEventRule(
  kind: GrimoireEventKind,
  rule: Omit<GrimoireCheckRule, "check">
): GrimoireCheckRule {
  return {
    ...rule,
    check(game) {
      const role = roleNames(game);
      return unfilledEvents(game)
        .filter((event) => eventKind(event) === kind)
        .sort((a, b) => a.grimoire_page - b.grimoire_page)
        .map((event) => ({
          rule: rule.id,
          page: event.grimoire_page + 1,
          message: `Page ${event.grimoire_page + 1}: ${describeEvent(game, event, role)}`,
        }));
    },
  };
}

export const unfilledDeaths = unfilledEventRule("death", {
  id: "unfilled-deaths",
  label: "Deaths",
  description: "A death without cause.",
  offByDefault: true,
});

export const unfilledChanges = unfilledEventRule("change", {
  id: "unfilled-changes",
  label: "Changes",
  description: "A character, alignment or seat change without cause.",
});

export const unfilledOther = unfilledEventRule("other", {
  id: "unfilled-other",
  label: "Other",
  description: "A revive, poisoning, drunkenness, madness or other event without cause.",
});

export const GRIMOIRE_EVENT_RULES: GrimoireCheckRule[] = [
  unfilledDeaths,
  unfilledChanges,
  unfilledOther,
];
