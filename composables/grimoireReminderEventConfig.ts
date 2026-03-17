import { GrimoireEventType } from "~/composables/useGames";

export type GrimoireReminderEventCadence =
  | "once"
  | "each_night"
  | "may_each_night"
  | "persistent";

export type GrimoireReminderEventConfig = {
  reminder: string;
  eventType: GrimoireEventType;
  cadence: GrimoireReminderEventCadence;
  sourceRoleIds: string[];
};

// Reminder-to-event mapping used for automated status-event inference.
// Only strict, high-confidence mappings should be added here.
export const GRIMOIRE_REMINDER_EVENT_CONFIG: GrimoireReminderEventConfig[] = [
  {
    reminder: "Mad",
    eventType: GrimoireEventType.MAD,
    cadence: "each_night",
    sourceRoleIds: ["cerenovus", "harpy", "pixie"],
  },
  {
    reminder: "Drunk",
    eventType: GrimoireEventType.DRUNK,
    cadence: "each_night",
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
    ],
  },
  {
    reminder: "Poisoned",
    eventType: GrimoireEventType.POISONED,
    cadence: "each_night",
    sourceRoleIds: [
      "poisoner",
      "widow",
      "pukka",
      "no_dashii",
      "lleech",
      "vigormortis",
      "snake_charmer",
      "cannibal",
    ],
  },
  {
    reminder: "Lunch",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["cannibal"],
  },
  {
    reminder: "Abnormal",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["mathematician"],
  },
  {
    reminder: "Chosen",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["exorcist", "dreamer", "lunatic"],
  },
  {
    reminder: "Visit",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["high_priestess"],
  },
  {
    reminder: "Chosen",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["nightwatchman"],
  },
  {
    reminder: "Chosen",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["ravenkeeper"],
  },
  {
    reminder: "Bounce",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["mayor"],
  },
  {
    reminder: "No Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["fisherman"],
  },
  {
    reminder: "No Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["artist"],
  },
  {
    reminder: "Bingo",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["amnesiac"],
  },
  {
    reminder: "No Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["fool"],
  },
  {
    reminder: "No Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["huntsman"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["monk"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["pacifist"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["soldier"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["tea_lady"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["devilsadvocate"],
  },
  {
    reminder: "Saved",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["deviant"],
  },
  {
    reminder: "No Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["preacher"],
  },
  {
    reminder: "Correct",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["juggler"],
  },
  {
    reminder: "Guess Used",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["puzzlemaster"],
  },
  {
    reminder: "Evil Wakes",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["poppygrower"],
  },
  {
    reminder: "Red Herring",
    eventType: GrimoireEventType.OTHER,
    cadence: "persistent",
    sourceRoleIds: ["fortune_teller"],
  },
  {
    reminder: "Yes",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["fortune_teller"],
  },
  {
    reminder: "Demon",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["choirboy"],
  },
  {
    reminder: "Demon",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["puzzlemaster"],
  },
  {
    reminder: "Outsider",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["librarian"],
  },
  {
    reminder: "Townsfolk",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["washerwoman"],
  },
  {
    reminder: "Minion",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["investigator"],
  },
  {
    reminder: "Know",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["steward"],
  },
  {
    reminder: "Died Today",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["undertaker"],
  },
  {
    reminder: "Doesn't Kill",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["princess"],
  },
  {
    reminder: "Master",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["butler"],
  },
  {
    reminder: "Claimed",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["goblin"],
  },
  {
    reminder: "Storyteller Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["plague_doctor"],
  },
  {
    reminder: "Dead",
    eventType: GrimoireEventType.DEATH,
    cadence: "once",
    sourceRoleIds: ["gunslinger"],
  },
  {
    reminder: "Alm",
    eventType: GrimoireEventType.OTHER,
    cadence: "persistent",
    sourceRoleIds: ["beggar"],
  },
  {
    reminder: "3 Votes",
    eventType: GrimoireEventType.OTHER,
    cadence: "persistent",
    sourceRoleIds: ["bureaucrat"],
  },
  {
    reminder: "Negative Vote",
    eventType: GrimoireEventType.OTHER,
    cadence: "persistent",
    sourceRoleIds: ["thief"],
  },
  {
    reminder: "Butchered",
    eventType: GrimoireEventType.EXECUTION,
    cadence: "once",
    sourceRoleIds: ["butcher"],
  },
  {
    reminder: "Stormcaught",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["stormcatcher"],
  },
  {
    reminder: "Has Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["bone_collector"],
  },
  {
    reminder: "Has Ability",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["banshee"],
  },
  {
    reminder: "Goal",
    eventType: GrimoireEventType.OTHER,
    cadence: "persistent",
    sourceRoleIds: ["zenomancer"],
  },
  {
    reminder: "Goal Completed",
    eventType: GrimoireEventType.OTHER,
    cadence: "once",
    sourceRoleIds: ["zenomancer"],
  },
  {
    reminder: "Is The Demon",
    eventType: GrimoireEventType.OTHER,
    cadence: "each_night",
    sourceRoleIds: ["lil_monsta"],
  },
  {
    reminder: "DEAD",
    eventType: GrimoireEventType.DEATH,
    cadence: "once",
    sourceRoleIds: ["bigwig"],
  },
];
