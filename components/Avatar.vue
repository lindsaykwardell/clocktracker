<template>
  <img
    :src="avatarUrl"
    class="rounded-full object-cover shadow-lg border border-black"
    :class="{
      'w-8 md:w-10 h-8 md:h-10 aspect-square': size === 'xs',
      'w-16 md:w-24 h-16 md:h-24 aspect-square': !size || size === 'md',
      'w-12 md:w-16 h-12 md:h-16 aspect-square': size === 'sm',
      'w-32 md:w-40 h-32 md:h-40 aspect-square	': size === 'lg',
    }"
    crossorigin="anonymous"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}>();

const avatarUrl = computed(
  () => `${props.value ?? "/img/default.png"}?width=500&height=500`
);
</script>
