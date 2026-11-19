// Builds realistic seeded games: standard team counts, a chosen game ending
// and grimoire pages that lead up to that ending.
//
// The generator only builds plain data. seed.js writes it to the database,
// so this file can be tried out without one.

const { v4: uuidv4 } = require("uuid");
const { faker } = require("@faker-js/faker");

// Reuse the role lists the game editor offers for each end trigger, so seeded
// games stay in step with the app. Loads through tsx; if it can't, endings
// that need those lists are skipped.
let END_TRIGGER_ROLE_INCLUDES = {};
let WILDCARD_ROLE_IDS = [];
try {
  ({ END_TRIGGER_ROLE_INCLUDES } = require("../composables/gameEndTriggerConfig.ts"));
  ({ WILDCARD_ROLE_IDS } = require("../composables/grimoireRoleGroups.ts"));
} catch (error) {
  console.warn(
    `[seed] Could not load end trigger config (${error.message}); ability endings are skipped.`
  );
}

// [townsfolk, outsiders, minions, demons] by player count.
const BASE_SETUP = {
  5: [3, 0, 1, 1],
  6: [3, 1, 1, 1],
  7: [5, 0, 1, 1],
  8: [5, 1, 1, 1],
  9: [5, 2, 1, 1],
  10: [7, 0, 2, 1],
  11: [7, 1, 2, 1],
  12: [7, 2, 2, 1],
  13: [9, 0, 3, 1],
  14: [9, 1, 3, 1],
  15: [9, 2, 3, 1],
};

// How often each player count is picked. Most games are mid-sized.
const PLAYER_COUNT_WEIGHTS = {
  5: 2, 6: 3, 7: 5, 8: 7, 9: 8, 10: 9, 11: 8, 12: 7, 13: 5, 14: 4, 15: 3,
};

// [*Setup*] characters that change the Outsider count. One option is picked.
const OUTSIDER_MODIFIERS = {
  baron: [2],
  godfather: [-1, 1],
  fang_gu: [1],
  vigormortis: [-1],
};

// Demons that don't sit as a single Demon token; left out unless the script
// has nothing else.
const UNUSUAL_DEMONS = new Set(["lil_monsta", "legion", "riot"]);

// Additional win conditions the seed knows how to set up.
// - winner: who wins, or "random" / "own" (the trigger's alignment).
// - final: what happens on the last page.
//   "execute_self": the trigger is executed.
//   "die_self": the trigger dies.
//   "execute_good": a good player is executed.
//   "three_alive": play down to 3 alive, then no death.
//   "none": no death on the last day.
const ADDITIONAL_WIN_CONDITIONS = {
  saint: { winner: "EVIL", final: "execute_self" },
  goblin: { winner: "EVIL", final: "execute_self" },
  klutz: { winner: "EVIL", final: "die_self" },
  mayor: { winner: "GOOD", final: "three_alive" },
  vortox: { winner: "EVIL", final: "none" },
  damsel: { winner: "EVIL", final: "none" },
  fearmonger: { winner: "EVIL", final: "execute_good" },
  evil_twin: { winner: "EVIL", final: "execute_good" },
  leviathan: {
    winner: "EVIL",
    final: "execute_good",
    subtypes: ["LEVIATHAN_SECOND_GOOD_EXECUTION", "LEVIATHAN_DAY_FIVE"],
  },
  atheist: {
    winner: "GOOD",
    final: "none",
    subtypes: ["ATHEIST_STORYTELLER_EXECUTED"],
  },
  alsaahir: { winner: "GOOD", final: "none" },
  cult_leader: { winner: "own", final: "none" },
};

const EARLY_END_NOTES = [
  "Ran out of time",
  "Player had to leave",
  "Storyteller mistake",
  "Server issues",
];
const OTHER_END_NOTES = [
  "Storyteller ruling",
  "Evil team conceded",
  "Good team conceded",
];

// --- Random helpers ---------------------------------------------------------

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p) => Math.random() < p;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const sample = (list, count) => shuffle(list).slice(0, count);

// Picks a key from { key: weight }, ignoring keys with no weight.
function weighted(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let roll = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries.at(-1)?.[0];
}

// --- Setup ------------------------------------------------------------------

function rolesByType(roles) {
  const pools = {
    TOWNSFOLK: [],
    OUTSIDER: [],
    MINION: [],
    DEMON: [],
    TRAVELER: [],
    FABLED: [],
    LORIC: [],
  };
  for (const role of roles) pools[role.type]?.push(role);
  return pools;
}

// Draws the characters for one game, or null if the script can't fill it.
function buildSetup(pools, playerCount) {
  const [townsfolkBase, outsiderBase, minionCount] = BASE_SETUP[playerCount];

  const usualDemons = pools.DEMON.filter((r) => !UNUSUAL_DEMONS.has(r.id));
  const demon = pick(usualDemons.length ? usualDemons : pools.DEMON);
  if (!demon || pools.MINION.length < minionCount) return null;
  const minions = sample(pools.MINION, minionCount);

  let outsiderDelta = 0;
  for (const role of [demon, ...minions]) {
    if (OUTSIDER_MODIFIERS[role.id]) {
      outsiderDelta += pick(OUTSIDER_MODIFIERS[role.id]);
    }
  }

  const outsiderCount = Math.min(
    Math.max(outsiderBase + outsiderDelta, 0),
    pools.OUTSIDER.length
  );
  const townsfolkCount = townsfolkBase + outsiderBase - outsiderCount;
  if (townsfolkCount < 0 || townsfolkCount > pools.TOWNSFOLK.length) {
    return null;
  }

  return [
    ...sample(pools.TOWNSFOLK, townsfolkCount),
    ...sample(pools.OUTSIDER, outsiderCount),
    ...minions,
    demon,
  ];
}

function pickSetup(pools) {
  // Teensyville scripts only have enough characters for 5 or 6 players.
  const isTeensy = pools.TOWNSFOLK.length < 9;
  const weights = Object.fromEntries(
    Object.entries(PLAYER_COUNT_WEIGHTS).filter(
      ([count]) => !isTeensy || Number(count) <= 6
    )
  );

  for (let attempt = 0; attempt < 30; attempt++) {
    const setup = buildSetup(pools, Number(weighted(weights)));
    if (setup) return setup;
  }
  throw new Error("Could not build a setup for this script");
}

// --- Ending -----------------------------------------------------------------

// Roles in play that the editor would offer for this trigger/type/cause.
function triggerCandidates(trigger, type, cause, seats, scriptRoleIds) {
  const config = END_TRIGGER_ROLE_INCLUDES[trigger]?.[type]?.[cause];
  if (!config) return [];
  const allowed = new Set([
    ...config.base,
    ...config.conditional
      .filter((entry) => entry.requires.every((id) => scriptRoleIds.has(id)))
      .map((entry) => entry.role),
  ]);
  return seats.filter((seat) => allowed.has(seat.role.id));
}

// Picks who triggered the ending. Wildcards (Cannibal, Pixie, ...) are in
// every list, so they only get the odd turn; the Demon is preferred when it
// can do it itself.
function pickTriggerSeat(candidates) {
  const demon = candidates.find((s) => s.role.type === "DEMON");
  if (demon && chance(0.75)) return demon;
  const regular = candidates.filter((s) => !WILDCARD_ROLE_IDS.includes(s.role.id));
  return pick(regular.length && !chance(0.15) ? regular : candidates);
}

// Chooses how the game ends before the grimoire is built.
function pickEnding(seats, scriptRoleIds, fabled) {
  const demonSeat = seats.find((s) => s.role.type === "DEMON");
  const nonDemon = (list) => list.filter((s) => s.role.type !== "DEMON");

  const noDemonOptions = {
    "EXECUTION/NOMINATION": { weight: 65 },
    "DEATH/ABILITY": {
      weight: 15,
      candidates: nonDemon(
        triggerCandidates("NO_LIVING_DEMON", "DEATH", "ABILITY", seats, scriptRoleIds)
      ),
    },
    "EXECUTION/ABILITY": {
      weight: 6,
      candidates: nonDemon(
        triggerCandidates("NO_LIVING_DEMON", "EXECUTION", "ABILITY", seats, scriptRoleIds)
      ),
    },
    "CHARACTER_CHANGE/ABILITY": {
      weight: 6,
      candidates: nonDemon(
        triggerCandidates("NO_LIVING_DEMON", "CHARACTER_CHANGE", "ABILITY", seats, scriptRoleIds)
      ),
    },
  };

  const twoLeftOptions = {
    "DEATH/ABILITY": {
      weight: 60,
      candidates: triggerCandidates(
        "TWO_PLAYERS_LEFT_ALIVE", "DEATH", "ABILITY", seats, scriptRoleIds
      ),
    },
    "EXECUTION/NOMINATION": { weight: 30 },
    "EXECUTION/ABILITY": {
      weight: 10,
      candidates: triggerCandidates(
        "TWO_PLAYERS_LEFT_ALIVE", "EXECUTION", "ABILITY", seats, scriptRoleIds
      ),
    },
  };

  const additionalSeats = seats.filter((s) => ADDITIONAL_WIN_CONDITIONS[s.role.id]);
  const hasFiddler = fabled.some((r) => r.id === "fiddler");

  const trigger = weighted({
    NOT_RECORDED: 25,
    NO_LIVING_DEMON: 35,
    TWO_PLAYERS_LEFT_ALIVE: 25,
    ADDITIONAL_WIN_CONDITION: additionalSeats.length || hasFiddler ? 10 : 0,
    GAME_ENDED_EARLY: 3,
    OTHER: 2,
  });

  // Picks a type/cause whose role list has someone in play.
  const pickTypeCause = (options) => {
    const usable = Object.fromEntries(
      Object.entries(options)
        .filter(([, o]) => !o.candidates || o.candidates.length)
        .map(([key, o]) => [key, o.weight])
    );
    const key = weighted(usable);
    const [type, cause] = key.split("/");
    const candidates = options[key].candidates;
    return { type, cause, triggerSeat: candidates ? pickTriggerSeat(candidates) : null };
  };

  if (trigger === "NOT_RECORDED") {
    // Play out a normal ending but don't record how it ended.
    const recorded = chance(0.55)
      ? { trigger: "NO_LIVING_DEMON", ...pickTypeCause({ "EXECUTION/NOMINATION": { weight: 1 } }) }
      : { trigger: "TWO_PLAYERS_LEFT_ALIVE", type: "DEATH", cause: "ABILITY", triggerSeat: demonSeat };
    return { ...recorded, winner: recorded.trigger === "NO_LIVING_DEMON" ? "GOOD" : "EVIL", recorded: false };
  }

  if (trigger === "NO_LIVING_DEMON") {
    return { trigger, ...pickTypeCause(noDemonOptions), winner: "GOOD", recorded: true };
  }

  if (trigger === "TWO_PLAYERS_LEFT_ALIVE") {
    return { trigger, ...pickTypeCause(twoLeftOptions), winner: "EVIL", recorded: true };
  }

  if (trigger === "ADDITIONAL_WIN_CONDITION") {
    if (hasFiddler && (!additionalSeats.length || chance(0.2))) {
      return {
        trigger,
        type: null,
        cause: "ABILITY",
        triggerSeat: null,
        triggerRole: fabled.find((r) => r.id === "fiddler"),
        winner: chance(0.5) ? "GOOD" : "EVIL",
        final: "execute_good",
        recorded: true,
      };
    }
    const triggerSeat = pick(additionalSeats);
    const rule = ADDITIONAL_WIN_CONDITIONS[triggerSeat.role.id];
    return {
      trigger,
      type: null,
      cause: "ABILITY",
      triggerSeat,
      winner:
        rule.winner === "own"
          ? triggerSeat.alignment
          : rule.winner === "random"
            ? pick(["GOOD", "EVIL"])
            : rule.winner,
      final: rule.final,
      subtype: rule.subtypes ? pick(rule.subtypes) : "",
      recorded: true,
    };
  }

  // GAME_ENDED_EARLY or OTHER
  return {
    trigger,
    type: null,
    cause: null,
    triggerSeat: null,
    winner: chance(0.5) ? "GOOD" : "EVIL",
    note: pick(trigger === "OTHER" ? OTHER_END_NOTES : EARLY_END_NOTES),
    recorded: true,
  };
}

// --- Grimoire ---------------------------------------------------------------

// Plays the game day by day and returns one snapshot per grimoire page:
// { dead: Set<seatIndex>, roleChanges: Map<seatIndex, role> }.
function playGame(seats, ending, pools) {
  const dead = new Set();
  const roleChanges = new Map();
  const pages = [];
  const snapshot = () =>
    pages.push({ dead: new Set(dead), roleChanges: new Map(roleChanges) });

  const demonIndex = seats.findIndex((s) => s.role.type === "DEMON");
  const triggerIndex = ending.triggerSeat ? seats.indexOf(ending.triggerSeat) : -1;
  const protectedSeats = new Set([demonIndex, triggerIndex].filter((i) => i >= 0));

  const alive = () => seats.map((_, i) => i).filter((i) => !dead.has(i));
  const killable = () => alive().filter((i) => !protectedSeats.has(i));
  const isGood = (i) => seats[i].alignment === "GOOD";

  // The Demon mostly kills good players; executions hit evil more often.
  const nightKill = () => {
    const options = killable();
    const good = options.filter(isGood);
    const target = good.length && chance(0.85) ? pick(good) : pick(options);
    if (target !== undefined) dead.add(target);
  };
  const execute = () => {
    const target = pick(killable());
    if (target !== undefined) dead.add(target);
  };
  const executeGood = () => {
    const good = killable().filter(isGood);
    const target = pick(good.length ? good : killable());
    if (target !== undefined) dead.add(target);
    return target;
  };

  // Ordinary days: a night death and maybe an execution, keeping at least
  // `minAlive` players alive for the final day.
  const playDays = (days, minAlive) => {
    for (let day = 0; day < days; day++) {
      if (alive().length - 2 < minAlive) break;
      nightKill();
      if (chance(0.75)) execute();
      snapshot();
    }
  };

  // Plays until 3 are left alive; returns once a day ends with 3 alive.
  const playDownToThree = () => {
    while (alive().length > 3 && killable().length) {
      nightKill();
      if (alive().length > 3 && chance(0.7)) execute();
      snapshot();
    }
  };

  const maxDays = Math.max(1, Math.floor((seats.length - 3) / 2));
  snapshot(); // Setup page: everyone alive.

  const { trigger, type } = ending;

  if (trigger === "NO_LIVING_DEMON") {
    playDays(randInt(0, maxDays - 1), 4);
    if (alive().length > 3) nightKill();
    if (type === "CHARACTER_CHANGE") {
      // The Demon is turned into a Townsfolk that isn't in play.
      const inPlay = new Set(seats.map((s) => s.role.id));
      const options = pools.TOWNSFOLK.filter((r) => !inPlay.has(r.id));
      roleChanges.set(demonIndex, pick(options.length ? options : pools.TOWNSFOLK));
    } else {
      dead.add(demonIndex);
    }
    snapshot();
  } else if (trigger === "TWO_PLAYERS_LEFT_ALIVE") {
    playDownToThree();
    if (type === "DEATH") {
      nightKill();
    } else if (ending.triggerSeat?.role.id === "mutant") {
      dead.add(triggerIndex);
    } else {
      executeGood();
    }
    // Whoever is left must include the Demon: trim any extra survivors.
    while (alive().length > 2 && killable().length) execute();
    snapshot();
  } else if (trigger === "ADDITIONAL_WIN_CONDITION") {
    const { final } = ending;
    if (final === "three_alive") {
      playDownToThree();
      snapshot();
    } else {
      playDays(randInt(0, maxDays - 1), 4);
      if (alive().length > 3) nightKill();
      if (final === "execute_self" || final === "die_self") {
        dead.add(triggerIndex);
      } else if (final === "execute_good") {
        executeGood();
      }
      snapshot();
    }
  } else {
    // Ended early or other: stop somewhere along the way.
    playDays(randInt(0, maxDays), 3);
  }

  return pages;
}

// --- Game -------------------------------------------------------------------

/**
 * Builds the data for one game. `script.roles` are Role rows; `extras` holds
 * Role rows for all Fabled, Lorics and Travellers.
 */
function generateGame({ script, user, extras }) {
  const pools = rolesByType(script.roles);
  const scriptRoleIds = new Set(script.roles.map((r) => r.id));

  // Seats: the core setup plus the odd Traveller.
  const travellerPool = pools.TRAVELER.length && chance(0.5)
    ? pools.TRAVELER
    : extras.travellers;
  const travellerCount = weighted({ 0: 80, 1: 15, 2: 5 });
  const roles = [
    ...pickSetup(pools),
    ...sample(travellerPool, Number(travellerCount)),
  ];

  const userSeat = randInt(0, roles.length - 1);
  const seats = shuffle(roles).map((role, i) => ({
    participant_id: uuidv4(),
    name: i === userSeat ? user.username : faker.person.firstName(),
    player_id: i === userSeat ? user.user_id : null,
    role,
    alignment:
      role.type === "TRAVELER"
        ? chance(0.7) ? "GOOD" : "EVIL"
        : role.initial_alignment,
  }));

  // Fabled and Lorics sit outside the circle, never in a seat.
  const fabled = [];
  if (pools.FABLED.length && chance(0.6)) fabled.push(...pools.FABLED);
  else if (chance(0.15)) fabled.push(...sample(extras.fabled, chance(0.8) ? 1 : 2));
  if (pools.LORIC.length && chance(0.6)) fabled.push(...pools.LORIC);
  else if (chance(0.05)) fabled.push(pick(extras.lorics));

  const ending = pickEnding(seats, scriptRoleIds, fabled);
  const pages = playGame(seats, ending, pools);

  // Demon bluffs: good characters that aren't in play.
  const inPlay = new Set(roles.map((r) => r.id));
  const demon_bluffs = chance(0.6)
    ? sample(
        [...pools.TOWNSFOLK, ...pools.TOWNSFOLK, ...pools.OUTSIDER].filter(
          (r) => !inPlay.has(r.id)
        ),
        12
      )
        .filter((r, i, list) => list.findIndex((o) => o.id === r.id) === i)
        .slice(0, 3)
    : [];

  // Characters the user played, in order (a Pit-Hagged Demon gets two).
  const ownSeat = seats[userSeat];
  const player_characters = [{ role: ownSeat.role, alignment: ownSeat.alignment }];
  const changedRole = pages.at(-1).roleChanges.get(userSeat);
  if (changedRole) {
    player_characters.push({ role: changedRole, alignment: ownSeat.alignment });
  }

  // The player who caused the ending. For an execution by nomination it is
  // a living player who nominated.
  let triggerSeat = ending.triggerSeat;
  if (!triggerSeat && ending.cause === "NOMINATION") {
    const lastDead = pages.at(-1).dead;
    const survivors = seats.filter((_, i) => !lastDead.has(i));
    triggerSeat = pick(survivors);
  }
  const triggerRole = ending.triggerRole ?? triggerSeat?.role ?? null;

  return {
    player_count: seats.length,
    win_v2: ending.winner === "GOOD" ? "GOOD_WINS" : "EVIL_WINS",
    end_trigger: ending.recorded ? ending.trigger : "NOT_RECORDED",
    end_trigger_type: ending.recorded ? ending.type ?? null : null,
    end_trigger_cause: ending.recorded ? ending.cause ?? null : null,
    end_trigger_role_id: ending.recorded ? triggerRole?.id ?? null : null,
    end_trigger_participant_id:
      ending.recorded ? triggerSeat?.participant_id ?? null : null,
    end_trigger_participant_alignment:
      ending.recorded ? triggerSeat?.alignment ?? null : null,
    end_trigger_subtype: ending.recorded ? ending.subtype ?? "" : "",
    end_trigger_note: ending.recorded ? ending.note ?? "" : "",
    player_characters,
    demon_bluffs,
    fabled,
    grimoire: pages.map((page) =>
      seats.map((seat, i) => {
        const role = page.roleChanges.get(i) ?? seat.role;
        return {
          grimoire_participant_id: seat.participant_id,
          player_name: seat.name,
          player_id: seat.player_id,
          role_id: role.id,
          alignment: seat.alignment,
          is_dead: page.dead.has(i),
          order: i,
        };
      })
    ),
  };
}

module.exports = { generateGame, rolesByType, BASE_SETUP };
