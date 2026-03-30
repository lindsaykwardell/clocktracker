import type { AppUpdateDefinition } from "./types";
import { grimoireEventsBackfillUpdate } from "./grimoireEventsBackfill";

const UPDATES: AppUpdateDefinition[] = [grimoireEventsBackfillUpdate];

export function listAppUpdates() {
  return UPDATES;
}

export function getAppUpdate(id: string) {
  return UPDATES.find((update) => update.id === id) || null;
}
