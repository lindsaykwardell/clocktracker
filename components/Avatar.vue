<template>
  <img
    :src="value"
    class="rounded-full object-cover shadow-lg border border-black"
    :class="{
      'w-16 md:w-24 aspect-square': !size || size === 'md',
      'w-12 md:w-16 aspect-square': size === 'sm',
      'w-32 md:w-40 aspect-square	': size === 'lg',
    }"
    crossorigin="anonymous"
  />
</template>

<script setup lang="ts">
defineProps<{
  value?: string;
  size?: "sm" | "md" | "lg";
}>();
</script>
