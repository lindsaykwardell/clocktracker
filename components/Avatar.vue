<template>
  <img
    :src="value"
    class="rounded-full w-16 md:w-24 h-16 md:h-24 object-cover shadow-lg border border-black"
  />
</template>

<script setup lang="ts">
defineProps<{
  value?: string;
}>();
</script>
