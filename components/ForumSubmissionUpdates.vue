<template>
  <Badge v-if="count" color="caution" size="xs" :aria-label="`${count} unread moderation decisions`">{{ count }}</Badge>
</template>
<script setup lang="ts">
const count = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
async function refresh() {
  try { count.value = (await $fetch('/api/forum/submissions/unread-count')).count; }
  catch { count.value = 0; }
}
onMounted(() => { refresh(); timer = setInterval(refresh, 30000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>
