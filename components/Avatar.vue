<template>
  <img
    :src="avatarUrl"
    class="rounded-full w-16 md:w-24 h-16 md:h-24 shadow-lg border border-black"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: string;
}>();

const avatarUrl = computed(() => {
  // If it's an email, get the Gravatar for it
  // If it's a URL, use that

  // if (props.value?.includes("@")) {
  // return `https://www.gravatar.com/avatar/${MD5(props.value)}`;
  // } else {
  return props.value;
  // }
});
</script>
