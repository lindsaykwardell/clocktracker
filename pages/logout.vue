<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <Loading />
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
const isCapacitor = useRuntimeConfig().public.isCapacitorBuild;

onMounted(async () => {
  // Unregister push subscription before signing out
  try {
    if (isCapacitor) {
      // On Capacitor, clean up FCM token
      const { fcmToken } = useCapacitorPush();
      if (fcmToken.value) {
        await $fetch("/api/fcm-token", {
          method: "DELETE",
          body: { token: fcmToken.value },
        });
      }
    } else if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await $fetch("/api/push-subscription", {
          method: "DELETE",
          body: { endpoint },
        });
      }
    }
  } catch {
    // Best-effort — don't block logout
  }

  await supabase.auth.signOut();
  router.push("/");
});
</script>
