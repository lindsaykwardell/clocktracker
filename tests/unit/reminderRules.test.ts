import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REMINDER_EVENT_CONFIG,
  REMINDER_RULES,
  normalizeRuleReminderName,
  reminderLifetime,
} from "../../shared/reminderRules";
import {
  buildReminderCatalog,
  catalogEntryForReminder,
  reminderRoleId,
} from "../../shared/reminderCatalog";
import { applyReminderLifetimes } from "../../shared/reminderLifetimes";

test("a shared reminder gets each role's own lifetime", () => {
  assert.equal(reminderLifetime("sailor", "Drunk"), "until_night");
  assert.equal(reminderLifetime("philosopher", "Drunk"), "stays");
  assert.equal(reminderLifetime("courtier", "Drunk 3"), "countdown");
  assert.equal(reminderLifetime("poisoner", "Poisoned"), "until_night");
  assert.equal(reminderLifetime("widow", "Poisoned"), "stays");
  assert.equal(reminderLifetime("monk", "Saved"), "next_phase");
  assert.equal(reminderLifetime("monk", "Safe"), "until_day");
  assert.equal(reminderLifetime("innkeeper", "Safe"), "until_night");
});

test("records of this page end with it", () => {
  assert.equal(reminderLifetime("imp", "Dead"), "next_phase");
  assert.equal(reminderLifetime("gunslinger", "Dead"), "next_phase");
  assert.equal(reminderLifetime("pit-hag", "Changed"), "next_phase");
  assert.equal(reminderLifetime("professor", "Alive"), "next_phase");
});

test("a reminder without a rule stays", () => {
  assert.equal(reminderLifetime("washerwoman", "Wrong"), "stays");
  assert.equal(reminderLifetime("tea_lady", "Cannot Die"), "stays");
  assert.equal(reminderLifetime("nobody", "Anything"), "stays");
});

test("no role has two lifetimes for the same reminder", () => {
  const seen = new Map<string, string>();
  for (const rule of REMINDER_RULES) {
    const key = `${rule.roleId}|${normalizeRuleReminderName(rule.reminder)}`;
    const lifetime = seen.get(key);
    if (lifetime) assert.equal(rule.lifetime, lifetime, key);
    seen.set(key, rule.lifetime);
  }
});

test("the event rules keep one rule per group with its roles in order", () => {
  const drunk = REMINDER_EVENT_CONFIG.find((config) => config.reminder === "Drunk");
  assert.deepEqual(drunk, {
    reminder: "Drunk",
    eventType: "DRUNK",
    sourceRoleIds: [
      "sailor",
      "innkeeper",
      "courtier",
      "philosopher",
      "sweetheart",
      "goon",
      "puzzlemaster",
      "organ_grinder",
      "village_idiot",
      "minstrel",
    ],
  });
  const soldierSaved = REMINDER_EVENT_CONFIG.find(
    (config) => config.reminder === "Saved" && config.sourceRoleIds[0] === "soldier"
  );
  assert.deepEqual(soldierSaved, {
    reminder: "Saved",
    eventType: "OTHER",
    sourceRoleIds: ["soldier"],
    targetScope: "self",
    targetRoleIds: ["soldier"],
  });
  const genericExecuted = REMINDER_EVENT_CONFIG.filter(
    (config) => config.reminder === "Executed" && config.sourceRoleIds.length === 0
  );
  assert.equal(genericExecuted.length, 1);
});

const catalog = buildReminderCatalog([
  {
    id: "sailor",
    token_url: "/img/role/sailor.webp",
    reminders: [
      { id: 1, reminder: "Drunk" },
      { id: 2, reminder: "Saved" },
    ],
  },
  { id: "philosopher", token_url: "/img/role/philosopher.webp", reminders: [{ id: 3, reminder: "Drunk" }] },
  {
    id: "courtier",
    token_url: "/img/role/courtier.webp",
    reminders: [
      { id: 4, reminder: "Drunk 3" },
      { id: 5, reminder: "Drunk 2" },
      { id: 6, reminder: "Drunk 1" },
    ],
  },
  { id: "monk", token_url: "/img/role/monk.webp", reminders: [{ id: 7, reminder: "Safe" }] },
  { id: "imp", token_url: "/img/role/imp.webp", reminders: [{ id: 8, reminder: "Dead" }] },
  { id: "minstrel", token_url: "/img/role/minstrel.webp", reminders: [{ id: 10, reminder: "Everyone Is Drunk" }] },
  { id: "po", token_url: "/img/role/po.webp", reminders: [{ id: 11, reminder: "3 Attacks" }] },
  {
    id: "xaan",
    token_url: "/img/role/xaan.webp",
    reminders: [
      { id: 12, reminder: "Night 1" },
      { id: 13, reminder: "Night 2" },
      { id: 14, reminder: "Night 3" },
      { id: 15, reminder: "X" },
    ],
  },
  {
    id: "leviathan",
    token_url: "/img/role/leviathan.webp",
    reminders: [
      { id: 16, reminder: "Day 1" },
      { id: 17, reminder: "Day 2" },
    ],
  },
  // A homebrew role that reuses an official icon.
  { id: "my_imp", token_url: "/img/role/imp.webp", custom_role: true, reminders: [{ id: 9, reminder: "Dead" }] },
]);

test("the catalog finds a reminder's role by its link, else by its icon", () => {
  assert.equal(reminderRoleId(catalog, { role_reminder_id: 3, token_url: "/img/role/sailor.webp" }), "philosopher");
  assert.equal(reminderRoleId(catalog, { token_url: "/img/role/sailor.webp" }), "sailor");
  assert.equal(reminderRoleId(catalog, { role_reminder_id: 999, token_url: "/img/role/monk.webp" }), "monk");
  assert.equal(reminderRoleId(catalog, { token_url: "/img/unknown.webp" }), null);
  assert.equal(reminderRoleId(catalog, { token_url: "" }), null);
  assert.equal(reminderRoleId(null, { role_reminder_id: 1 }), null);
});

test("an icon shared with a homebrew role belongs to the official role", () => {
  assert.equal(reminderRoleId(catalog, { token_url: "/img/role/imp.webp" }), "imp");
  assert.equal(reminderRoleId(catalog, { role_reminder_id: 9, token_url: "/img/role/imp.webp" }), "my_imp");
  assert.equal(
    catalogEntryForReminder(catalog, { reminder: "Dead", token_url: "/img/role/imp.webp" })?.id,
    8
  );
});

function reminder(roleId: string, text: string, id: number | null) {
  return {
    reminder: text,
    token_url: `/img/role/${roleId}.webp`,
    role_reminder_id: id,
    is_custom: false,
  };
}

test("a new day ends the night's reminders, a new night the day's", () => {
  const tokens = [
    {
      reminders: [
        reminder("sailor", "Drunk", 1),
        reminder("philosopher", "Drunk", 3),
        reminder("monk", "Safe", 7),
        reminder("imp", "Dead", 8),
      ],
    },
  ];
  const day = applyReminderLifetimes(tokens, "DAY", catalog);
  assert.equal(day.removed, 2);
  assert.deepEqual(
    tokens[0].reminders.map((r) => r.reminder + "@" + r.role_reminder_id),
    ["Drunk@1", "Drunk@3"]
  );

  const night = applyReminderLifetimes(tokens, "NIGHT", catalog);
  assert.equal(night.removed, 1);
  assert.deepEqual(
    tokens[0].reminders.map((r) => r.reminder + "@" + r.role_reminder_id),
    ["Drunk@3"]
  );
});

test("a Saved ends with the page either way", () => {
  for (const type of ["DAY", "NIGHT"] as const) {
    const tokens = [{ reminders: [reminder("sailor", "Saved", 2)] }];
    assert.equal(applyReminderLifetimes(tokens, type, catalog).removed, 1);
    assert.equal(tokens[0].reminders.length, 0);
  }
});

test("the Courtier's Drunk counts down each night and is relinked", () => {
  const tokens = [{ reminders: [reminder("courtier", "Drunk 3", 4)] }];

  assert.equal(applyReminderLifetimes(tokens, "DAY", catalog).countedDown, 0);
  assert.equal(tokens[0].reminders[0].reminder, "Drunk 3");

  assert.equal(applyReminderLifetimes(tokens, "NIGHT", catalog).countedDown, 1);
  assert.equal(tokens[0].reminders[0].reminder, "Drunk 2");
  assert.equal(tokens[0].reminders[0].role_reminder_id, 5);

  applyReminderLifetimes(tokens, "NIGHT", catalog);
  assert.equal(tokens[0].reminders[0].reminder, "Drunk 1");
  assert.equal(tokens[0].reminders[0].role_reminder_id, 6);

  const last = applyReminderLifetimes(tokens, "NIGHT", catalog);
  assert.equal(last.removed, 1);
  assert.equal(tokens[0].reminders.length, 0);
});

test("unlinked reminders are matched by icon; made-up ones stay", () => {
  const tokens = [
    {
      reminders: [
        reminder("sailor", "Drunk", null),
        { ...reminder("sailor", "Drunk", null), is_custom: true },
        { reminder: "Drunk", token_url: "/img/unknown.webp", role_reminder_id: null },
        { reminder: "Drunk", token_url: "", role_reminder_id: null },
      ],
    },
  ];
  const result = applyReminderLifetimes(tokens, "NIGHT", catalog);
  assert.equal(result.removed, 1);
  assert.equal(tokens[0].reminders.length, 3);
});

test("undo puts the reminders back as they were", () => {
  const original = [reminder("sailor", "Drunk", 1), reminder("courtier", "Drunk 2", 5)];
  const tokens = [{ reminders: original }];
  const result = applyReminderLifetimes(tokens, "NIGHT", catalog);
  assert.equal(result.removed, 1);
  assert.equal(result.countedDown, 1);
  result.undo();
  assert.equal(tokens[0].reminders, original);
  assert.equal(original[1].reminder, "Drunk 2");
});

/** Adds pages like the editor: a copy of the last page, then the lifetimes. */
function playPages(
  start: { page_type: "DAY" | "NIGHT"; tokens: { order: number; reminders: ReturnType<typeof reminder>[] }[] },
  types: ("DAY" | "NIGHT")[]
) {
  const pages = [start];
  for (const type of types) {
    const page = { page_type: type, tokens: JSON.parse(JSON.stringify(pages.at(-1)!.tokens)) };
    applyReminderLifetimes(page.tokens, type, catalog, pages);
    pages.push(page);
  }
  return pages.map((page) => page.tokens[0].reminders.length);
}

test("the Minstrel's drunk lasts until dusk tomorrow", () => {
  // Placed on Day 1: stays for Night 2 and Day 2, ends at Night 3.
  const counts = playPages(
    { page_type: "DAY", tokens: [{ order: 0, reminders: [reminder("minstrel", "Everyone Is Drunk", 10)] }] },
    ["NIGHT", "DAY", "NIGHT"]
  );
  assert.deepEqual(counts, [1, 1, 1, 0]);
});

test("the Po's 3 Attacks lasts until the attack night is over", () => {
  // Placed on Night 1 (chose no-one): stays for Day 1 and Night 2, ends at Day 2.
  const counts = playPages(
    { page_type: "NIGHT", tokens: [{ order: 0, reminders: [reminder("po", "3 Attacks", 11)] }] },
    ["DAY", "NIGHT", "DAY"]
  );
  assert.deepEqual(counts, [1, 1, 1, 0]);
});

test("a two-phase reminder stays when there are no earlier pages to compare", () => {
  const tokens = [{ reminders: [reminder("minstrel", "Everyone Is Drunk", 10)] }];
  assert.equal(applyReminderLifetimes(tokens, "NIGHT", catalog).removed, 0);
});

test("the Xaan's night counts up each night and stops at its last reminder", () => {
  const tokens = [{ reminders: [reminder("xaan", "Night 1", 12)] }];
  const seen: string[] = [];
  for (const type of ["DAY", "NIGHT", "DAY", "NIGHT", "DAY", "NIGHT"] as const) {
    applyReminderLifetimes(tokens, type, catalog);
    seen.push(`${tokens[0].reminders[0].reminder}@${tokens[0].reminders[0].role_reminder_id}`);
  }
  assert.deepEqual(seen, ["Night 1@12", "Night 2@13", "Night 2@13", "Night 3@14", "Night 3@14", "Night 3@14"]);
});

test("a Day counter counts up on new days", () => {
  const tokens = [{ reminders: [reminder("leviathan", "Day 1", 16)] }];
  assert.equal(applyReminderLifetimes(tokens, "NIGHT", catalog).countedUp, 0);
  assert.equal(applyReminderLifetimes(tokens, "DAY", catalog).countedUp, 1);
  assert.equal(tokens[0].reminders[0].reminder, "Day 2");
  assert.equal(tokens[0].reminders[0].role_reminder_id, 17);
});

test("the Xaan's X ends at the following dusk", () => {
  const tokens = [{ reminders: [reminder("xaan", "X", 15)] }];
  assert.equal(applyReminderLifetimes(tokens, "DAY", catalog).removed, 0);
  assert.equal(applyReminderLifetimes(tokens, "NIGHT", catalog).removed, 1);
});
