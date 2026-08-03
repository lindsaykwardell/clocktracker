import { openOfflineDB } from "./offlineDB";
import { nanoid } from "nanoid";

const IMAGE_STORE = "pending-images";

// Images attached while offline are stored locally as blobs and referenced in
// a game's `image_urls` by this sentinel until they're uploaded on sync.
export const OFFLINE_IMAGE_PREFIX = "offline-image:";

export function isOfflineImageRef(url: string): boolean {
  return url.startsWith(OFFLINE_IMAGE_PREFIX);
}

interface StoredImage {
  id: string;
  blob: Blob;
  name: string;
  type: string;
}

/** Persist a picked image locally and return its `offline-image:<id>` ref. */
export async function storeOfflineImage(file: File): Promise<string> {
  const id = nanoid();
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    const entry: StoredImage = {
      id,
      blob: file,
      name: file.name,
      type: file.type,
    };
    const request = tx.objectStore(IMAGE_STORE).add(entry);
    request.onsuccess = () => resolve(`${OFFLINE_IMAGE_PREFIX}${id}`);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredImage(ref: string): Promise<StoredImage | null> {
  const id = ref.slice(OFFLINE_IMAGE_PREFIX.length);
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readonly");
    const request = tx.objectStore(IMAGE_STORE).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Resolve an offline ref to an object URL for display. Caller revokes it. */
export async function getOfflineImageObjectURL(ref: string): Promise<string | null> {
  const stored = await getStoredImage(ref);
  if (!stored) return null;
  return URL.createObjectURL(stored.blob);
}

/** Rebuild a File from a stored offline image, ready for upload. */
export async function getOfflineImageFile(ref: string): Promise<File | null> {
  const stored = await getStoredImage(ref);
  if (!stored) return null;
  return new File([stored.blob], stored.name, { type: stored.type });
}

export async function removeOfflineImage(ref: string): Promise<void> {
  const id = ref.slice(OFFLINE_IMAGE_PREFIX.length);
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    const request = tx.objectStore(IMAGE_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
