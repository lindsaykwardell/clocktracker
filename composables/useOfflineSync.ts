import {
  enqueueGame,
  getQueuedGames,
  removeQueuedGame,
  getQueueCount,
  type QueuedGame,
} from "~/utils/syncQueue";
import {
  isOfflineImageRef,
  getOfflineImageFile,
  removeOfflineImage,
} from "~/utils/offlineImages";
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";
import { markRaw } from "vue";

const pendingCount = ref(0);
const syncing = ref(false);

// Shared online state — one set of listeners for the whole app.
const isOnline = ref(
  typeof navigator !== "undefined" ? navigator.onLine : true
);
let onlineListenersAttached = false;
function ensureOnlineListeners() {
  if (onlineListenersAttached || typeof window === "undefined") return;
  onlineListenersAttached = true;
  window.addEventListener("online", () => (isOnline.value = true));
  window.addEventListener("offline", () => (isOnline.value = false));
}

// Transient message shown when the user tries to reach an online-only page.
const blockedNotice = ref<string | null>(null);
let blockedTimer: ReturnType<typeof setTimeout> | null = null;
function notifyOfflineBlocked(message: string) {
  blockedNotice.value = message;
  if (blockedTimer) clearTimeout(blockedTimer);
  blockedTimer = setTimeout(() => (blockedNotice.value = null), 5000);
}

export function useOfflineSync() {
  ensureOnlineListeners();

  async function refreshCount() {
    try {
      pendingCount.value = await getQueueCount();
    } catch {
      pendingCount.value = 0;
    }
  }

  async function queueGame(payload: string, displayData?: string): Promise<string> {
    const placeholderId = await enqueueGame(payload, displayData);
    injectQueuedGameIntoStore(placeholderId, displayData || payload, Date.now());
    await refreshCount();
    return placeholderId;
  }

  async function flushQueue() {
    if (syncing.value || !isOnline.value) return;

    const queued = await getQueuedGames();
    if (queued.length === 0) return;

    const games = useGames();

    syncing.value = true;
    try {
      for (const entry of queued) {
        try {
          // Upload any locally-stashed images first and swap in the real URLs.
          const { payload, uploadedRefs } = await uploadQueuedImages(entry.payload);

          await $fetch<{ id: string }>("/api/games", {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "application/json" },
          });
          await removeQueuedGame(entry.id!);
          for (const ref of uploadedRefs) await removeOfflineImage(ref);

          // Remove placeholder from store
          games.games.delete(entry.placeholderId);
        } catch (err: any) {
          // Distinguish a server rejection (4xx — this game will never sync,
          // so drop it rather than blocking the queue forever) from a
          // connectivity failure (stop and retry the whole queue later).
          const status = err?.statusCode ?? err?.response?.status;
          if (typeof status === "number" && status >= 400 && status < 500) {
            console.error("[sync] Server rejected queued game, dropping it:", err);
            await removeQueuedGame(entry.id!);
            games.games.delete(entry.placeholderId);
            continue;
          }
          console.error("[sync] Failed to sync game, will retry later:", err);
          break;
        }
      }
    } finally {
      syncing.value = false;
      await refreshCount();

      // Re-fetch player games to get the real server data
      if (isOnline.value) {
        const me = useMe();
        if (me.value.status === Status.SUCCESS) {
          games.fetchPlayerGames(me.value.data.username);
        }
      }
    }
  }

  async function hydrateQueuedGames() {
    try {
      const queued = await getQueuedGames();
      for (const entry of queued) {
        injectQueuedGameIntoStore(entry.placeholderId, entry.displayData || entry.payload, entry.createdAt);
      }
    } catch {}
  }

  return {
    isOnline: readonly(isOnline),
    pendingCount: readonly(pendingCount),
    syncing: readonly(syncing),
    blockedNotice: readonly(blockedNotice),
    notifyOfflineBlocked,
    queueGame,
    flushQueue,
    refreshCount,
    hydrateQueuedGames,
  };
}

// Uploads any offline image blobs referenced in a queued game's payload and
// rewrites image_urls to the real URLs. Returns the rewritten payload plus the
// refs that were successfully uploaded, so the caller can clean them up once
// the game itself has synced.
async function uploadQueuedImages(
  payloadStr: string
): Promise<{ payload: string; uploadedRefs: string[] }> {
  const parsed = JSON.parse(payloadStr);
  const imageUrls: string[] = parsed.image_urls ?? [];
  if (!imageUrls.some(isOfflineImageRef)) {
    return { payload: payloadStr, uploadedRefs: [] };
  }

  const uploadedRefs: string[] = [];
  const resolved: string[] = [];
  for (const url of imageUrls) {
    if (!isOfflineImageRef(url)) {
      resolved.push(url);
      continue;
    }
    const file = await getOfflineImageFile(url);
    if (!file) continue; // blob is gone — skip rather than block the sync

    const formData = new FormData();
    formData.append("file", file);
    const urls = await $fetch<string[]>("/api/storage/game-attachments", {
      method: "POST",
      body: formData,
    });
    resolved.push(...urls);
    uploadedRefs.push(url);
  }

  parsed.image_urls = resolved;
  return { payload: JSON.stringify(parsed), uploadedRefs };
}

function injectQueuedGameIntoStore(placeholderId: string, payload: string, createdAt: number) {
  try {
    const games = useGames();
    const me = useMe();
    const parsed = JSON.parse(payload);

    let username = "";
    let userId = "";

    if (me.value.status === Status.SUCCESS) {
      username = me.value.data.username;
      userId = me.value.data.user_id;
    } else {
      // Fall back to localStorage cache for offline startup
      try {
        const cached = localStorage.getItem("ct-last-user");
        if (cached) {
          const userData = JSON.parse(cached);
          username = userData.username || "";
          userId = userData.user_id || "";
        }
      } catch {}
    }

    const gameRecord = {
      // Prisma Game fields
      id: placeholderId,
      user_id: userId,
      created_at: new Date(createdAt).toISOString(),
      date: parsed.date ? `${parsed.date}T00:00:00.000Z` : new Date().toISOString(),
      script: parsed.script || "",
      script_id: parsed.script_id ?? null,
      location_type: parsed.location_type || "ONLINE",
      location: parsed.location || "",
      community_name: parsed.community_name || "",
      community_id: parsed.community_id ?? null,
      player_count: parsed.player_count ?? null,
      traveler_count: parsed.traveler_count ?? null,
      is_storyteller: parsed.is_storyteller || false,
      win_v2: parsed.win_v2 || WinStatus_V2.NOT_RECORDED,
      notes: parsed.notes || "",
      image_urls: parsed.image_urls || [],
      old_image_urls: [],
      storyteller: parsed.storyteller ?? null,
      co_storytellers: parsed.co_storytellers || [],
      grimoire_id: null,
      parent_game_id: null,
      ignore_for_stats: false,
      tags: parsed.tags || [],
      waiting_for_confirmation: false,
      deleted: false,
      deleted_date: null,
      privacy: parsed.privacy || "PUBLIC",
      bgg_id: parsed.bgg_id ?? null,
      ls_game_id: parsed.ls_game_id ?? null,
      favorite_id: null,

      // Relations
      player_characters: (parsed.player_characters || []).map((c: any) => ({
        name: c.name || "",
        alignment: c.alignment || null,
        related: c.related || "",
        role_id: c.role_id || null,
        related_role_id: c.related_role_id || null,
        role: c.role && c.role.token_url && c.role.token_url !== "/1x1.png"
          ? c.role
          : null,
        related_role: c.related_role && c.related_role.token_url && c.related_role.token_url !== "/1x1.png"
          ? c.related_role
          : null,
      })),
      demon_bluffs: parsed.demon_bluffs || [],
      fabled: parsed.fabled || [],
      grimoire: (parsed.grimoire || []).map((page: any) => ({
        ...page,
        tokens: (page.tokens || []).map((token: any) => ({
          ...token,
          // Normalize related_role: only keep if it has an actual role_id
          related_role: token.related_role_id ? token.related_role : null,
          related_role_id: token.related_role_id || null,
          // Ensure reminders is an array
          reminders: token.reminders || [],
          // Ensure player fields exist
          player_id: token.player_id || null,
          player: token.player || null,
        })),
      })),
      child_games: [],
      parent_game: null,
      community: null,
      associated_script: null,
      ls_game: null,
      user: { username },

      // Sync marker
      _pendingSync: true,
    } as unknown as GameRecord & { _pendingSync: boolean };

    games.games.set(placeholderId, {
      status: Status.SUCCESS,
      data: markRaw(gameRecord),
    });
  } catch (err) {
    console.error("[sync] Failed to inject queued game:", err);
  }
}
