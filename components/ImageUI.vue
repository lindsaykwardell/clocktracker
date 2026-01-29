<template>
  <img
    class="ct-ui-image"
    :src="imageUrl"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  image: string;
}>();

const { public: { assetVersion } } = useRuntimeConfig();

const imageUrl = computed(() => {
  const base = `/img/ui/${props.image}.webp`;
  if (!assetVersion) {
    return base;
  }
  return `${base}?v=${assetVersion}`;
});
</script>
