<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Notifications</h2>
      <div class="space-y-4 w-full xl:w-3/4">
        <h3 class="text-2xl">Push Notifications</h3>
        <p class="text-stone-500 dark:text-stone-400">
          Get notified when someone replies to a forum thread you're subscribed to.
        </p>

        <div v-if="!isSupported" class="text-stone-500 dark:text-stone-400">
          <p>Push notifications are not supported in this browser.</p>
          <p class="text-sm mt-1">
            On iOS, push notifications require adding ClockTracker to your Home Screen.
          </p>
        </div>

        <div v-else-if="permissionDenied" class="text-stone-500 dark:text-stone-400">
          <p>
            Notification permission was denied. To enable push notifications,
            update your {{ isCapacitor ? "device" : "browser's" }} notification
            settings for {{ isCapacitor ? "ClockTracker" : "this site" }}, then
            refresh the page.
          </p>
        </div>

        <div v-else>
          <label class="flex gap-4 items-center">
            <Toggle v-model="pushEnabled" :disabled="loading" />
            <span>{{ loading ? "Updating..." : "Enable push notifications" }}</span>
          </label>
        </div>
      </div>
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const config = useRuntimeConfig();
const isCapacitor = config.public.isCapacitorBuild;

const isSupported = ref(false);
const permissionDenied = ref(false);
const pushEnabled = ref(false);
const loading = ref(false);
let currentSubscription: PushSubscription | null = null;

onMounted(async () => {
  if (isCapacitor) {
    await initCapacitor();
  } else {
    await initWebPush();
  }
});

async function initCapacitor() {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  isSupported.value = true;

  const permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === "denied") {
    permissionDenied.value = true;
    return;
  }

  // Check if user already has push enabled via their settings
  const settings = await $fetch("/api/settings");
  pushEnabled.value = settings.push_notifications_enabled;
}

async function initWebPush() {
  isSupported.value = "PushManager" in window && "serviceWorker" in navigator;

  if (!isSupported.value) return;

  if (Notification.permission === "denied") {
    permissionDenied.value = true;
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  currentSubscription = await registration.pushManager.getSubscription();
  pushEnabled.value = !!currentSubscription;
}

watch(pushEnabled, async (enabled, oldValue) => {
  // Skip the initial watch trigger
  if (oldValue === undefined) return;

  loading.value = true;
  try {
    if (isCapacitor) {
      if (enabled) {
        await subscribeCapacitor();
      } else {
        await unsubscribeCapacitor();
      }
    } else {
      if (enabled) {
        await subscribe();
      } else {
        await unsubscribe();
      }
    }
  } catch {
    // Revert on failure
    pushEnabled.value = !enabled;
  } finally {
    loading.value = false;
  }
});

async function subscribeCapacitor() {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === "prompt") {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== "granted") {
    permissionDenied.value = permStatus.receive === "denied";
    throw new Error("Permission not granted");
  }

  await PushNotifications.register();
  // Token registration is handled by the capacitor-push plugin listener
}

async function unsubscribeCapacitor() {
  const { fcmToken } = useCapacitorPush();

  if (fcmToken.value) {
    await $fetch("/api/fcm-token", {
      method: "DELETE",
      body: { token: fcmToken.value },
    });
  }
}

async function subscribe() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    permissionDenied.value = permission === "denied";
    throw new Error("Permission not granted");
  }

  const registration = await navigator.serviceWorker.ready;
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

  currentSubscription = subscription;
}

async function unsubscribe() {
  if (currentSubscription) {
    const endpoint = currentSubscription.endpoint;
    await currentSubscription.unsubscribe();

    await $fetch("/api/push-subscription", {
      method: "DELETE",
      body: { endpoint },
    });

    currentSubscription = null;
  }
}

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
</script>
