<template>
  <img
    :src="avatarUrl"
    class="rounded-full object-cover shadow-lg border border-black"
    :class="{
      'bg-stone-300 dark:bg-stone-950': background === true,
      'w-8 md:w-10 h-8 md:h-10 aspect-square': size === 'xs',
      'w-16 md:w-24 h-16 md:h-24 aspect-square': !size || size === 'md',
      'w-12 md:w-16 h-12 md:h-16 aspect-square': size === 'sm',
      'w-8 h-8 md:w-12 md:h-12 aspect-square': size === 'sm-token', // Match SM role token.
      'w-32 md:w-40 h-32 md:h-40 aspect-square	': size === 'lg',
      'w-36 h-36 md:w-48 md:h-48 aspect-square': size === 'lg-token', // Match LG role token.
    }"
    crossorigin="anonymous"
    onerror="this.onerror=null;this.src='/img/default.png';"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: string | null;
  size?: "xs" | "sm" | "sm-token" | "md" | "lg" | "lg-token";
  background?: boolean;
}>();

const avatarUrl = computed(() => `${props.value ?? "/img/default.png"}`);
</script>
