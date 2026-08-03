import { openOfflineDB } from "./offlineDB";
import { nanoid } from "nanoid";

const QUEUE_STORE = "sync-queue";

// Optimistic, client-only games are keyed with this prefix until they sync.
// Anything reading a game id should treat these as local-only (never fetch
// them from the API, since the server has no record of them yet).
export const PENDING_GAME_PREFIX = "pending-";

export function isPendingGameId(id: string): boolean {
  return id.startsWith(PENDING_GAME_PREFIX);
}

export interface QueuedGame {
  id?: number;
  placeholderId: string;
  payload: string; // JSON-stringified game data (stripped, for server)
  displayData?: string; // JSON-stringified game data (full, for display)
  createdAt: number;
}

export async function enqueueGame(payload: string, displayData?: string): Promise<string> {
  const placeholderId = `${PENDING_GAME_PREFIX}${nanoid()}`;
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const entry: QueuedGame = { placeholderId, payload, displayData, createdAt: Date.now() };
    const request = store.add(entry);
    request.onsuccess = () => resolve(placeholderId);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedGames(): Promise<QueuedGame[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedGame(id: number): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQueueCount(): Promise<number> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
