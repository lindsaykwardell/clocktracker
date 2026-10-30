<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <Loading />
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
const staging = useRuntimeConfig().public.staging;
onMounted(async () => {
  if (staging) {
    // There is no staging service worker. Keep other production sessions intact.
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/");
    return;
  }
  // Unregister push subscription before signing out
  try {
    const registration = await navigator.serviceWorker?.ready;
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await $fetch("/api/push-subscription", {
        method: "DELETE",
        body: { endpoint },
      });
    }
  } catch {
    // Best-effort — don't block logout
  }

  await supabase.auth.signOut();
  router.push("/");
});
</script>
