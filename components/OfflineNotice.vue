<template>
  <div class="flex flex-col items-center gap-2 py-8 text-stone-500 dark:text-stone-400">
    <p class="text-lg font-sorts">Offline</p>
    <p class="text-sm">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: "This content will be available when you're back online.",
});
</script>
