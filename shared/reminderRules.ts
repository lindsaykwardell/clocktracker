/**
 * What each catalog reminder (a role's reminder) does in the grimoire editor:
 * which event placing it records, and how long it stays on the grimoire when
 * a new page starts the next phase.
 *
 * Events: placing one of these reminders records an event of that type
 * (see generateGrimoireEvents on the server and grimoireEventEngine in the
 * editor). Reminders of several roles that are matched together (the same
 * reminder text, the same event, the same targeting) share one event rule, so
 * the list is grouped by rule; the order of the groups and of the roles in a
 * group is the order the event engines try them in.
 *
 * Only strict, high-confidence mappings should be added here.
 */

export type ReminderEventType =
  | "DEATH"
  | "EXECUTION"
  | "REVIVE"
  | "SEAT_CHANGE"
  | "MAD"
  | "DRUNK"
  | "POISONED"
  | "OTHER";

/**
 * How long a reminder stays when "Add page" starts the next phase:
 * - `until_day`: removed when the new page is a Day (a night-only effect, or a
 *   marker read during the night).
 * - `until_night`: removed when the new page is a Night (chosen at night for
 *   "tonight and tomorrow", or a day-only effect).
 * - `next_phase`: removed on the next phase either way; it marks something
 *   that happened on this page only (a "Saved").
 * - `countdown`: "Drunk 3" becomes "Drunk 2", then "Drunk 1", then is removed,
 *   one step per new Night (the Courtier's 3 nights and 3 days).
 * - `count_up`: "Night 1" becomes "Night 2" on each new Night ("Day 1" on each
 *   new Day), as far as the role has reminders; the last one stays (Xaan,
 *   Summoner, Leviathan, Riot).
 * - `until_second_night`: survives the next Night and is removed at the one
 *   after (the Minstrel: drunk until dusk tomorrow).
 * - `until_second_day`: survives the next Day and is removed at the one after
 *   (the Po's 3 attacks, used the night after it chose no-one).
 * - `stays`: never removed automatically; set once and lasting, or a record of
 *   something that happened. The storyteller removes it by hand.
 */
export type ReminderLifetime =
  | "until_day"
  | "until_night"
  | "next_phase"
  | "countdown"
  | "count_up"
  | "until_second_night"
  | "until_second_day"
  | "stays";

export type ReminderTargetScope = "self" | "others" | "all";
export type ReminderSourceMode = "participant" | "npc";

/** How placing a reminder becomes an event; shared by the roles in a group. */
export type ReminderEventRule = {
  reminder: string;
  eventType: ReminderEventType;
  /** "npc": the source is a role, not a seat (a Fabled, a Loric, ...). */
  sourceMode?: ReminderSourceMode;
  /** Which tokens the reminder counts on, relative to the source roles. */
  targetScope?: ReminderTargetScope;
  targetRoleIds?: string[];
};

/** One role's reminder. */
export type ReminderRule = {
  roleId: string;
  /** Reminder text; "Drunk" also matches "Drunk 1", "Drunk 2", ... */
  reminder: string;
  lifetime: ReminderLifetime;
  event: ReminderEventRule | null;
};

/** A role in a group: its id, with a lifetime other than `stays` if needed. */
type GroupRole = string | [roleId: string, lifetime: ReminderLifetime];

type RuleGroup = { event: ReminderEventRule; roles: GroupRole[] };

function group(event: ReminderEventRule, roles: GroupRole[]): RuleGroup {
  return { event, roles };
}

const EVENT_GROUPS: RuleGroup[] = [
  group({ reminder: "Mad", eventType: "MAD" }, [
    ["cerenovus", "until_night"],
    ["harpy", "until_night"],
    "pixie",
  ]),
  group({ reminder: "Drunk", eventType: "DRUNK" }, [
    ["sailor", "until_night"],
    ["innkeeper", "until_night"],
    ["courtier", "countdown"],
    "philosopher",
    "sweetheart",
    ["goon", "until_night"],
    "puzzlemaster",
    ["organ_grinder", "until_night"],
    "village_idiot",
  ]),
  group({ reminder: "Poisoned", eventType: "POISONED" }, [
    ["poisoner", "until_night"],
    "widow",
    ["pukka", "until_night"],
    "no_dashii",
    "lleech",
    "vigormortis",
    "snake_charmer",
    "cannibal",
  ]),
  group({ reminder: "Lunch", eventType: "OTHER" }, ["cannibal"]),
  group({ reminder: "Abnormal", eventType: "OTHER" }, [["mathematician", "until_day"]]),
  group({ reminder: "Chosen", eventType: "OTHER" }, [
    ["exorcist", "until_night"],
    ["dreamer", "until_day"],
    ["lunatic", "until_day"],
  ]),
  group({ reminder: "Visit", eventType: "OTHER" }, [["high_priestess", "until_day"]]),
  group({ reminder: "Amigo", eventType: "OTHER" }, ["gnome"]),
  group({ reminder: "Chosen", eventType: "OTHER" }, ["nightwatchman"]),
  group({ reminder: "Chosen", eventType: "OTHER" }, ["ravenkeeper"]),
  group(
    { reminder: "Bounce", eventType: "OTHER", targetScope: "self", targetRoleIds: ["mayor"] },
    [["mayor", "until_day"]]
  ),
  group({ reminder: "No Ability", eventType: "OTHER" }, ["fisherman"]),
  ...[
    "artist",
    "seamstress",
    "slayer",
    "virgin",
    "courtier",
    "engineer",
    "nightwatchman",
    "professor",
    "assassin",
    "mezepheles",
    "bone_collector",
    "judge",
  ].map((roleId) =>
    group(
      { reminder: "No Ability", eventType: "OTHER", targetScope: "self", targetRoleIds: [roleId] },
      [roleId]
    )
  ),
  group({ reminder: "Bingo", eventType: "OTHER" }, ["amnesiac"]),
  group({ reminder: "No Ability", eventType: "OTHER" }, ["fool"]),
  group({ reminder: "No Ability", eventType: "OTHER" }, ["huntsman"]),
  group({ reminder: "Saved", eventType: "OTHER" }, [["monk", "next_phase"]]),
  group({ reminder: "Saved", eventType: "OTHER" }, [["pacifist", "next_phase"]]),
  group(
    { reminder: "Saved", eventType: "OTHER", targetScope: "self", targetRoleIds: ["soldier"] },
    [["soldier", "next_phase"]]
  ),
  group(
    { reminder: "Saved", eventType: "OTHER", targetScope: "self", targetRoleIds: ["sailor"] },
    [["sailor", "next_phase"]]
  ),
  group({ reminder: "Saved", eventType: "OTHER" }, [["innkeeper", "next_phase"]]),
  group({ reminder: "Saved", eventType: "OTHER" }, [["tea_lady", "next_phase"]]),
  group({ reminder: "Saved", eventType: "OTHER" }, [["devils_advocate", "next_phase"]]),
  group(
    { reminder: "Saved", eventType: "OTHER", targetScope: "self", targetRoleIds: ["deviant"] },
    [["deviant", "next_phase"]]
  ),
  group(
    { reminder: "Saved", eventType: "OTHER", targetScope: "self", targetRoleIds: ["lleech"] },
    [["lleech", "next_phase"]]
  ),
  group({ reminder: "No Ability", eventType: "OTHER" }, ["preacher"]),
  group({ reminder: "Correct", eventType: "OTHER" }, ["juggler"]),
  group({ reminder: "Guess Used", eventType: "OTHER", targetScope: "self" }, ["puzzlemaster"]),
  group(
    {
      reminder: "Evil Wakes",
      eventType: "OTHER",
      targetScope: "self",
      targetRoleIds: ["poppy_grower"],
    },
    ["poppy_grower"]
  ),
  group({ reminder: "Red Herring", eventType: "OTHER" }, ["fortune_teller"]),
  group({ reminder: "Yes", eventType: "OTHER" }, [["fortune_teller", "until_day"]]),
  group({ reminder: "Know", eventType: "OTHER" }, ["choirboy"]),
  group({ reminder: "Know", eventType: "OTHER" }, ["puzzlemaster"]),
  group({ reminder: "Know", eventType: "OTHER" }, ["sage"]),
  group({ reminder: "Outsider", eventType: "OTHER" }, ["librarian"]),
  group({ reminder: "Townsfolk", eventType: "OTHER" }, ["washerwoman"]),
  group({ reminder: "Minion", eventType: "OTHER" }, ["investigator"]),
  group({ reminder: "Know", eventType: "OTHER" }, ["steward", "balloonist", "noble"]),
  // Legacy Balloonist reminders (one per character type), counted as "Know".
  group({ reminder: "Seen Townsfolk", eventType: "OTHER" }, ["balloonist"]),
  group({ reminder: "Seen Outsider", eventType: "OTHER" }, ["balloonist"]),
  group({ reminder: "Seen Minion", eventType: "OTHER" }, ["balloonist"]),
  group({ reminder: "Seen Demon", eventType: "OTHER" }, ["balloonist"]),
  group({ reminder: "Died Today", eventType: "OTHER" }, [["undertaker", "until_day"]]),
  group({ reminder: "Doesn't Kill", eventType: "OTHER" }, [["princess", "until_day"]]),
  group({ reminder: "Master", eventType: "OTHER" }, [["butler", "until_night"]]),
  group({ reminder: "Claimed", eventType: "OTHER" }, [["goblin", "until_night"]]),
  group({ reminder: "Not In Play", eventType: "OTHER" }, [["ojo", "until_day"]]),
  group({ reminder: "Registers As Dead", eventType: "OTHER" }, ["zombuul"]),
  group({ reminder: "Storyteller Ability", eventType: "OTHER" }, ["plague_doctor"]),
  group({ reminder: "Swapped", eventType: "SEAT_CHANGE" }, [["matron", "until_night"]]),
  group({ reminder: "Dead", eventType: "DEATH" }, [["gunslinger", "next_phase"]]),
  group(
    { reminder: "Dead", eventType: "DEATH", targetScope: "self", targetRoleIds: ["tinker"] },
    [["tinker", "next_phase"]]
  ),
  group({ reminder: "Dead", eventType: "DEATH", sourceMode: "npc" }, [
    ["angel", "next_phase"],
  ]),
  group({ reminder: "Dead", eventType: "DEATH", sourceMode: "npc" }, [
    ["riot", "next_phase"],
  ]),
  group({ reminder: "Vote Given", eventType: "OTHER" }, ["beggar"]),
  group({ reminder: "3 Votes", eventType: "OTHER" }, [["bureaucrat", "until_night"]]),
  group({ reminder: "Negative Vote", eventType: "OTHER" }, [["thief", "until_night"]]),
  group({ reminder: "Acts Twice", eventType: "OTHER" }, [["barista", "until_night"]]),
  group({ reminder: "Sober and Healthy", eventType: "OTHER" }, [["barista", "until_night"]]),
  group({ reminder: "Sober & Healthy", eventType: "OTHER" }, [["barista", "until_night"]]),
  group({ reminder: "Executed", eventType: "EXECUTION" }, [["butcher", "next_phase"]]),
  group({ reminder: "Execution Failed", eventType: "OTHER" }, [["judge", "next_phase"]]),
  group(
    { reminder: "Executed", eventType: "EXECUTION", targetScope: "self", targetRoleIds: ["mutant"] },
    [["mutant", "next_phase"]]
  ),
  group(
    {
      reminder: "Executed",
      eventType: "EXECUTION",
      targetScope: "self",
      targetRoleIds: ["scapegoat"],
    },
    [["scapegoat", "next_phase"]]
  ),
  // Any role's "Executed" (the generic execution marker).
  group({ reminder: "Executed", eventType: "EXECUTION" }, []),
  group(
    { reminder: "Jumped", eventType: "DEATH", targetScope: "self", targetRoleIds: ["fang_gu"] },
    [["fang_gu", "next_phase"]]
  ),
  group({ reminder: "Alive", eventType: "REVIVE" }, [["professor", "next_phase"]]),
  group({ reminder: "Alive", eventType: "REVIVE" }, [["al-hadikhia", "next_phase"]]),
  group({ reminder: "Alive", eventType: "REVIVE" }, [["shabaloth", "next_phase"]]),
  group({ reminder: "Reincarnated", eventType: "REVIVE", sourceMode: "npc" }, [
    ["hindu", "next_phase"],
  ]),
  group({ reminder: "Saved", eventType: "OTHER", sourceMode: "npc" }, [
    ["ventriloquist", "next_phase"],
  ]),
  group({ reminder: "Stormcaught", eventType: "OTHER", sourceMode: "npc" }, ["storm_catcher"]),
  group({ reminder: "Safe", eventType: "OTHER", sourceMode: "npc" }, ["storm_catcher"]),
  group({ reminder: "Has Ability", eventType: "OTHER" }, ["bone_collector"]),
  group({ reminder: "Has Ability", eventType: "OTHER" }, ["pixie"]),
  group(
    {
      reminder: "Has Ability",
      eventType: "OTHER",
      targetScope: "self",
      targetRoleIds: ["banshee"],
    },
    ["banshee"]
  ),
  group({ reminder: "Goal", eventType: "OTHER", sourceMode: "npc" }, ["zenomancer"]),
  group({ reminder: "Goal Completed", eventType: "OTHER", sourceMode: "npc" }, ["zenomancer"]),
  group({ reminder: "Is The Demon", eventType: "OTHER" }, [["lil_monsta", "until_night"]]),
  group(
    {
      reminder: "Is The Demon",
      eventType: "OTHER",
      targetScope: "self",
      targetRoleIds: ["scarlet_woman"],
    },
    ["scarlet_woman"]
  ),
  group({ reminder: "Dead", eventType: "DEATH", sourceMode: "npc" }, [
    ["big_wig", "next_phase"],
  ]),
  group({ reminder: "Dead", eventType: "DEATH", sourceMode: "npc" }, [
    ["doomsayer", "next_phase"],
  ]),
  group({ reminder: "Dead", eventType: "DEATH", sourceMode: "npc" }, [
    ["hells_librarian", "next_phase"],
  ]),
];

/**
 * Reminders that record no event but still end with a phase (protection that
 * only lasts the night, a choice for tomorrow, something that happened today).
 * A reminder that is in neither list stays: info and setup ("Wrong", "Know", "Is The Drunk") and
 * lasting effects (Fearmonger "Fear", Tea Lady "Cannot Die").
 */
type LifetimeOnly = [roleId: string, reminder: string, lifetime: ReminderLifetime];

function recordsOfThisPage(
  reminder: string,
  roleIds: string[],
  lifetime: ReminderLifetime = "next_phase"
): LifetimeOnly[] {
  return roleIds.map((roleId) => [roleId, reminder, lifetime]);
}

function countUp(roleId: string, phase: "Night" | "Day", last: number): LifetimeOnly[] {
  return Array.from({ length: last }, (_, i) => [roleId, `${phase} ${i + 1}`, "count_up"]);
}

const LIFETIME_ONLY: LifetimeOnly[] = [
  ["monk", "Safe", "until_day"],
  ["innkeeper", "Safe", "until_night"],
  ["devils_advocate", "Survives Execution", "until_night"],
  // "Executed" marks the execution of that day; the generic Executed rule
  // records the event for any role, so these only add the lifetime.
  ["virgin", "Executed", "next_phase"],
  ["cerenovus", "Executed", "next_phase"],
  ["judge", "Executed", "next_phase"],
  ["vizier", "Executed", "next_phase"],

  // Chosen or learned at night, for that night only.
  ["acrobat", "Chosen", "until_day"],
  ["al-hadikhia", "1", "until_day"],
  ["al-hadikhia", "2", "until_day"],
  ["al-hadikhia", "3", "until_day"],

  // Something that happened today, read tonight.
  ["flowergirl", "Demon Voted", "until_day"],
  ["flowergirl", "Demon Not Voted", "until_day"],
  ["town_crier", "Minion Nominated", "until_day"],
  ["town_crier", "Minions Not Nominated", "until_day"],
  ["godfather", "Died Today", "until_day"],
  ["zombuul", "Died Today", "until_day"],
  ["cannibal", "Died Today", "until_day"],
  ["barber", "Haircuts Tonight", "until_day"],
  ["hatter", "Tea Party Tonight", "until_day"],
  ["mezepheles", "Turns Evil", "until_day"],
  ["cacklejack", "Not Me", "until_day"],
  ["duchess", "Visitor", "until_day"],
  ["duchess", "False Info", "until_day"],

  // Chosen at night for tomorrow, or only for today.
  ["witch", "Cursed", "until_night"],
  ["harpy", "2nd", "until_night"],
  ["barista", "?", "until_night"],
  ["organ_grinder", "About To Die", "until_night"],
  ["legion", "About To Die", "until_night"],
  ["bishop", "Nominate Good", "until_night"],
  ["bishop", "Nominate Evil", "until_night"],
  ["ventriloquist", "Mad", "until_night"],

  // Records of something that happened on this page (a kill, a character
  // change). The shroud and the new token show it from then on.
  ...recordsOfThisPage("Dead", [
    "acrobat", "acrobat_legacy", "assassin", "fang_gu", "gambler", "gossip",
    "grandmother", "harlot", "imp", "kazali", "legion", "lil_monsta", "lleech",
    "lord_of_typhon", "lycanthrope", "moonchild", "no_dashii", "ojo", "po", "pukka",
    "shabaloth", "vigormortis", "vortox", "yaggababble", "zombuul", "al-hadikhia",
    "boomdandy", "gangster", "gnome", "godfather", "golem", "harpy", "pit-hag",
    "psychopath", "slayer", "witch",
  ]),
  ...recordsOfThisPage("Changed", [
    "barber", "bounty_hunter", "cacklejack", "cult_leader", "engineer", "fang_gu",
    "farmer", "goon", "hatter", "huntsman", "imp", "kazali", "lord_of_typhon", "ogre",
    "pit-hag", "politician", "riot", "scarlet_woman", "snake_charmer", "summoner",
  ]),

  // Counters, one step per night or day.
  ...countUp("xaan", "Night", 3),
  ...countUp("summoner", "Night", 3),
  ...countUp("leviathan", "Day", 5),
  ...countUp("riot", "Day", 3),
  // Placed on night X, removed the following dusk.
  ["xaan", "X", "until_night"],

  // Lasts one phase longer than the next.
  ["minstrel", "Everyone Is Drunk", "until_second_night"],
  ["po", "3 Attacks", "until_second_day"],
];

function roleEntry(role: GroupRole): [string, ReminderLifetime] {
  return typeof role === "string" ? [role, "stays"] : role;
}

/** Every role's reminder with a rule, one entry per role and reminder. */
export const REMINDER_RULES: ReminderRule[] = [
  ...EVENT_GROUPS.flatMap(({ event, roles }) =>
    roles.map((role) => {
      const [roleId, lifetime] = roleEntry(role);
      return { roleId, reminder: event.reminder, lifetime, event };
    })
  ),
  ...LIFETIME_ONLY.map(([roleId, reminder, lifetime]) => ({
    roleId,
    reminder,
    lifetime,
    event: null,
  })),
];

/** An event rule with the roles whose reminders it matches, for the event engines. */
export type ReminderEventConfig = ReminderEventRule & { sourceRoleIds: string[] };

/** The event rules in engine order, each with its source roles. */
export const REMINDER_EVENT_CONFIG: ReminderEventConfig[] = EVENT_GROUPS.map(
  ({ event, roles }) => ({
    reminder: event.reminder,
    eventType: event.eventType,
    sourceRoleIds: roles.map((role) => roleEntry(role)[0]),
    ...(event.sourceMode ? { sourceMode: event.sourceMode } : {}),
    ...(event.targetScope ? { targetScope: event.targetScope } : {}),
    ...(event.targetRoleIds ? { targetRoleIds: event.targetRoleIds } : {}),
  })
);

/** Reminder text as the rules compare it ("Drunk 2" counts as "Drunk"). */
export function normalizeRuleReminderName(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (/^drunk\s+\d+$/.test(normalized)) return "drunk";
  return normalized;
}

const lifetimeByRoleAndReminder = new Map<string, ReminderLifetime>();
for (const rule of REMINDER_RULES) {
  const key = `${rule.roleId}\u0000${normalizeRuleReminderName(rule.reminder)}`;
  if (!lifetimeByRoleAndReminder.has(key)) {
    lifetimeByRoleAndReminder.set(key, rule.lifetime);
  }
}

/** How long a role's reminder stays; `stays` for one without a rule. */
export function reminderLifetime(roleId: string, reminder: string): ReminderLifetime {
  return (
    lifetimeByRoleAndReminder.get(`${roleId}\u0000${normalizeRuleReminderName(reminder)}`) ??
    "stays"
  );
}
