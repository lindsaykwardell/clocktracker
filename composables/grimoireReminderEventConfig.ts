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
];
