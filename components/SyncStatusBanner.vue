<template>
  <div
    v-if="message"
    :class="[
      'p-2 min-h-[42px] text-sm text-center',
      isError
        ? 'bg-amber-400 dark:bg-amber-900'
        : 'bg-stone-200 dark:bg-stone-800',
    ]"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
const { isOnline, pendingCount, syncing, blockedNotice } = useOfflineSync();

// A blocked-navigation notice takes priority, then live offline/sync status.
const message = computed(() => {
  if (blockedNotice.value) return blockedNotice.value;

  if (!isOnline.value) {
    const base = "You're offline — new games are saved on this device.";
    return pendingCount.value > 0
      ? `${base} ${pendingCount.value} waiting to sync.`
      : base;
  }

  if (syncing.value) return "Syncing your games…";

  if (pendingCount.value > 0) {
    return `${pendingCount.value} game${
      pendingCount.value === 1 ? "" : "s"
    } waiting to sync.`;
  }

  return null;
});

const isError = computed(() => !!blockedNotice.value);
</script>
