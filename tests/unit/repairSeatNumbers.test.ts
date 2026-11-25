import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applySeatRepairs,
  hasBrokenSeatNumbers,
  planSeatRepairs,
  seatRepairMessage,
} from "../../server/utils/repairSeatNumbers";
import { brokenSeatNumbers } from "../../utils/grimoireChecks";

let nextId = 1;

function seat(order: number, name: string, roleId = "chef") {
  return { id: nextId++, order, player_name: name, player_id: null, role_id: roleId };
}

/** A page with these names in seat order. */
function page(names: string[], roles: string[] = []) {
  return { tokens: names.map((name, order) => seat(order, name, roles[order] ?? "chef")) };
}

test("a page with a seat number twice is repaired from its neighbours", () => {
  const before = page(["Griet", "Ann", "Bo", "Cy"]);
  // Griet is stored as seat 3, next to Cy; there is no seat 0.
  const broken = {
    tokens: [seat(3, "Griet"), seat(1, "Ann"), seat(2, "Bo"), seat(3, "Cy")],
  };
  const after = page(["Griet", "Ann", "Bo", "Cy"]);

  const plan = planSeatRepairs([before, broken, after]);

  assert.equal(plan.unrepaired.length, 0);
  assert.equal(plan.repairs.length, 1);
  assert.equal(plan.repairs[0].problem, "seat 4 twice, no seat 1");
  assert.deepEqual(plan.repairs[0].orders, [{ tokenId: broken.tokens[0].id, from: 3, to: 0 }]);

  applySeatRepairs([before, broken, after], plan);
  assert.equal(hasBrokenSeatNumbers(broken), false);
  assert.equal(
    seatRepairMessage(plan),
    "Automated fix: Incorrect seating order repaired on page 2."
  );
});

test("the message lists every repaired page", () => {
  const repair = (page: number) => ({ page, problem: "", from: [], orders: [] });
  const message = (pages: number[]) =>
    seatRepairMessage({ repairs: pages.map(repair), unrepaired: [] });

  assert.equal(message([2, 4]), "Automated fix: Incorrect seating order repaired on pages 3 and 5.");
  assert.equal(message([0, 2, 4]), "Automated fix: Incorrect seating order repaired on pages 1, 3 and 5.");
});

test("the first page is repaired from the one after it", () => {
  const broken = { tokens: [seat(1, "Ann"), seat(1, "Bo"), seat(2, "Cy")] };
  const next = page(["Bo", "Ann", "Cy"]);

  const plan = planSeatRepairs([broken, next]);

  assert.equal(plan.repairs.length, 1);
  assert.deepEqual(plan.repairs[0].from, [1]);
});

test("no repair when the neighbouring pages disagree", () => {
  const before = page(["Ann", "Bo", "Cy"]);
  const broken = { tokens: [seat(1, "Ann"), seat(1, "Bo"), seat(2, "Cy")] };
  const after = page(["Bo", "Ann", "Cy"]);

  const plan = planSeatRepairs([before, broken, after]);

  assert.equal(plan.repairs.length, 0);
  assert.match(plan.unrepaired[0].reason, /don't agree/);
});

test("no repair for a seat without a name", () => {
  const before = page(["Ann", "", "Cy"]);
  const broken = { tokens: [seat(1, "Ann"), seat(1, ""), seat(2, "Cy")] };

  const plan = planSeatRepairs([before, broken]);

  assert.equal(plan.repairs.length, 0);
  assert.match(plan.unrepaired[0].reason, /without a player name/);
});

test("no repair in a game where players change seats on purpose", () => {
  const before = page(["Ann", "Bo", "Cy"], ["matron", "chef", "imp"]);
  const broken = { tokens: [seat(1, "Ann", "matron"), seat(1, "Bo"), seat(2, "Cy", "imp")] };
  const musical = planSeatRepairs([page(["Ann", "Bo", "Cy"]), broken], { script: "Musical Chairs" });

  assert.equal(planSeatRepairs([before, broken]).repairs.length, 0);
  assert.equal(musical.repairs.length, 0);
  assert.match(musical.unrepaired[0].reason, /change seats/);
});

test("clean pages need nothing", () => {
  const plan = planSeatRepairs([page(["Ann", "Bo"]), page(["Bo", "Ann"])]);

  assert.deepEqual(plan, { repairs: [], unrepaired: [] });
});

test("the games check lists pages with incorrect seat numbers", () => {
  const findings = brokenSeatNumbers.check({
    grimoire: [
      { tokens: [{ order: 0 }, { order: 1 }] },
      { tokens: [{ order: 1 }, { order: 1 }] },
    ].map((p) => ({
      tokens: p.tokens.map((t) => ({ ...t, player_name: null, player_id: null, role_id: null, alignment: null })),
    })),
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].message, "Page 2: seat 2 twice, no seat 1");
});
