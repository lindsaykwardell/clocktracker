<template>
  <img
    :src="value"
    class="rounded-full object-cover shadow-lg border border-black"
    :class="{
      'w-16 md:w-24 h-16 md:h-24 ': !size || size === 'md',
      'w-12 md:w-16 h-12 md:h-16': size === 'sm',
      'w-32 md:w-40 h-32 md:h-40': size === 'lg',
    }"
  />
</template>

<script setup lang="ts">
defineProps<{
  value?: string;
  size?: "sm" | "md" | "lg";
}>();
</script>
