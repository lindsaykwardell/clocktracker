<template>
  <div v-if="remaining > 0" role="status" class="fixed bottom-4 left-1/2 z-50 w-[min(90vw,32rem)] -translate-x-1/2 rounded border border-amber-500 bg-stone-900 p-4 text-white shadow-lg">
    {{ notice.message }} Try again in {{ remaining }} seconds.
  </div>
</template>

<script setup lang="ts">
const notice = useState("rate-limit-notice", () => ({ until: 0, message: "" }));
const now = ref(Date.now());
const remaining = computed(() => Math.max(0, Math.ceil((notice.value.until - now.value) / 1000)));
let timer: ReturnType<typeof setInterval>;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 1000); });
onUnmounted(() => clearInterval(timer));
</script>
