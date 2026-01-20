<template>
  <Button
    component="a"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    variant="link"
    :icon='iconID'
  >
    <slot />
  </Button>
</template>

<script setup lang="ts">
const props = defineProps<{
  href: string;
  linkClass?: string;
  iconClass?: string;
}>();

const url = computed(() =>
  props.href.match(/^https?:\/\//) ? props.href : `https://${props.href}`
);

const iconID = computed(() => {
  const href = props.href;
  if (href.includes("github.com")) return 'github';
  if (href.includes("twitter.com") || href.includes("x.com")) return 'twitter';
  if (href.includes("twitch.tv")) return 'twitch';
  if (href.includes("youtube.com")) return 'youtube';
  if (href.includes("discord.gg")) return 'discord';
  if (href.includes("bsky.app")) return 'bluesky';
  if (href.includes("facebook.com")) return 'facebook';
  return 'website';
});
</script>
