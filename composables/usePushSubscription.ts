function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * If the user has push_notifications_enabled but this browser doesn't have
 * an active push subscription, automatically subscribe and register it.
 * Requires notification permission to already be granted — will not prompt.
 */
export async function syncPushSubscription(pushNotificationsEnabled: boolean) {
  if (!pushNotificationsEnabled) return;
  if (typeof window === "undefined") return;
  if (!("PushManager" in window) || !("serviceWorker" in navigator)) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return; // Already subscribed on this browser

    const config = useRuntimeConfig();
    if (!config.public.vapidPublicKey) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
    });

    const json = subscription.toJSON();

    await $fetch("/api/push-subscription", {
      method: "POST",
      body: {
        endpoint: json.endpoint,
        keys: json.keys,
      },
    });
  } catch {
    // Best-effort — don't disrupt login flow
  }
}
