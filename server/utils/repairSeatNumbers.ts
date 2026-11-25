import { normalizePlayerName } from "~/composables/grimoireParticipantMatching";
import { SEAT_MOVING_ROLES, isSeatMovingScript } from "~/utils/grimoireChecks";

/**
 * Some older grimoire pages store the same seat number twice and skip
 * another (seats 1, 1, 2, ... with no 0). Sorting such a page by seat
 * number puts a player in the wrong seat, which reads as seat changes.
 *
 * The background fill repairs those pages before it makes the events, going
 * by where each player sits on the neighbouring pages. It only does so when
 * that's certain:
 * - every seat on the page has a player (account or name), each only once;
 * - the neighbouring pages with clean seat numbers (the one before and the
 *   one after, where they exist) all seat every one of those players, and
 *   agree on where;
 * - nobody in the game changes seats on purpose (a Matron, or a script like
 *   Musical Chairs): there the neighbouring pages can't say where someone
 *   sat.
 * Anything else is left as it is and reported, for a person to look at.
 */

export type SeatRepairToken = {
  id: number;
  order: number;
  player_name: string | null;
  player_id: string | null;
  role_id: string | null;
};

export type SeatRepairPage = { tokens: SeatRepairToken[] };

export type SeatRepair = {
  /** 0-based page index. */
  page: number;
  /** What was wrong, for the revision message ("seat 10 twice, no seat 1"). */
  problem: string;
  /** The 0-based neighbouring pages the seats were taken from. */
  from: number[];
  /** Only the tokens whose seat number changes. */
  orders: { tokenId: number; from: number; to: number }[];
};

export type SeatRepairPlan = {
  repairs: SeatRepair[];
  unrepaired: { page: number; problem: string; reason: string }[];
};

/** Whether a page's seat numbers are anything other than 0, 1, 2, ... once each. */
export function hasBrokenSeatNumbers(page: SeatRepairPage) {
  const orders = page.tokens.map((token) => token.order).sort((a, b) => a - b);
  return orders.some((order, seat) => order !== seat);
}

/** "seat 10 twice, no seat 1" (seats counted from 1, as the editor shows them). */
function describeProblem(page: SeatRepairPage) {
  const counts = new Map<number, number>();
  for (const token of page.tokens) counts.set(token.order, (counts.get(token.order) ?? 0) + 1);
  const twice = [...counts].filter(([, count]) => count > 1).map(([order]) => order + 1);
  const missing: number[] = [];
  for (let seat = 0; seat < page.tokens.length; seat += 1) {
    if (!counts.has(seat)) missing.push(seat + 1);
  }
  const parts = [
    ...twice.map((seat) => `seat ${seat} twice`),
    ...(missing.length ? [`no seat ${missing.join(", ")}`] : []),
  ];
  return parts.join(", ") || "seat numbers out of range";
}

function playerKey(token: SeatRepairToken) {
  if (token.player_id) return `account:${token.player_id}`;
  const name = normalizePlayerName(token.player_name);
  return name ? `name:${name}` : null;
}

/** Each player's seat on a page, or null when a player has no key or appears twice. */
function seatsByPlayer(page: SeatRepairPage) {
  const seats = new Map<string, number>();
  for (const token of page.tokens) {
    const key = playerKey(token);
    if (!key || seats.has(key)) return null;
    seats.set(key, token.order);
  }
  return seats;
}

export function planSeatRepairs(
  pages: SeatRepairPage[],
  options: { script?: string | null } = {}
): SeatRepairPlan {
  const plan: SeatRepairPlan = { repairs: [], unrepaired: [] };
  const broken = pages.map(hasBrokenSeatNumbers);
  if (!broken.some(Boolean)) return plan;

  const movesSeats =
    isSeatMovingScript(options.script) ||
    pages.some((page) =>
      page.tokens.some((token) => !!token.role_id && SEAT_MOVING_ROLES.has(token.role_id))
    );

  pages.forEach((page, index) => {
    if (!broken[index]) return;
    const problem = describeProblem(page);
    const skip = (reason: string) => plan.unrepaired.push({ page: index, problem, reason });

    if (movesSeats) return skip("players change seats in this game (Matron or the script)");

    const neighbours = [index - 1, index + 1].filter(
      (other) => other >= 0 && other < pages.length && !broken[other]
    );
    if (neighbours.length === 0) return skip("no neighbouring page with clean seat numbers");

    const own = seatsByPlayer(page);
    if (!own) return skip("a seat without a player name, or a name on two seats");

    const orders: SeatRepair["orders"] = [];
    const taken = new Set<number>();
    for (const token of page.tokens) {
      const key = playerKey(token)!;
      const seats = neighbours.map((other) => seatsByPlayer(pages[other])?.get(key));
      const seat = seats[0];
      if (seat === undefined || seats.some((other) => other !== seat)) {
        return skip("the neighbouring pages don't agree on where everyone sits");
      }
      if (taken.has(seat)) return skip("two players would end up on one seat");
      taken.add(seat);
      if (seat !== token.order) orders.push({ tokenId: token.id, from: token.order, to: seat });
    }
    if (taken.size !== page.tokens.length || [...taken].some((seat) => seat >= page.tokens.length)) {
      return skip("the seats don't add up to this page's seats");
    }

    plan.repairs.push({ page: index, problem, from: neighbours, orders });
  });

  return plan;
}

/** Applies a plan's new seat numbers to the pages in memory. */
export function applySeatRepairs(pages: SeatRepairPage[], plan: SeatRepairPlan) {
  for (const repair of plan.repairs) {
    const byId = new Map(pages[repair.page].tokens.map((token) => [token.id, token]));
    for (const change of repair.orders) {
      const token = byId.get(change.tokenId);
      if (token) token.order = change.to;
    }
  }
}

/**
 * The message for the revision saved before the repair (the revision holds
 * the grimoire as it was), for the player reading their history: "Automated
 * fix: Incorrect seating order repaired on pages 3 and 5."
 */
export function seatRepairMessage(plan: SeatRepairPlan) {
  const numbers = plan.repairs.map((repair) => repair.page + 1);
  const list =
    numbers.length === 1
      ? `page ${numbers[0]}`
      : `pages ${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}`;
  return `Automated fix: Incorrect seating order repaired on ${list}.`;
}
