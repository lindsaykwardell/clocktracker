<template>
  <Badge
    v-if="count"
    color="caution"
    size="sm"
    :title="`${pending} awaiting review · ${reports} open reports`"
    :aria-label="`Moderation: ${pending} awaiting review, ${reports} open reports`"
  >
    {{ count }}
  </Badge>
</template>
<script setup lang="ts">
const pending = ref(0);
const reports = ref(0);
const count = computed(() => pending.value + reports.value);
let timer: ReturnType<typeof setInterval> | null = null;
async function refresh() {
  if (!useFeatureFlags().isEnabled('forum')) return;
  try {
    const result = await $fetch('/api/forum/moderation/summary');
    pending.value = result.pending;
    reports.value = result.reports;
  } catch { pending.value = 0; reports.value = 0; }
}
onMounted(() => { refresh(); timer = setInterval(refresh, 30000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>
