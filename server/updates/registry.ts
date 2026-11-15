import type { AppUpdateDefinition } from "./types";
// Grimoire events for older games are filled by the background job in
// server/cron/grimoireEventsFill.ts, which only ever adds events.
const UPDATES: AppUpdateDefinition[] = [];

export function listAppUpdates() {
  return UPDATES;
}

export function getAppUpdate(id: string) {
  return UPDATES.find((update) => update.id === id) || null;
}
