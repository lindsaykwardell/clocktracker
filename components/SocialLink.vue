<template>
  <div class="flex gap-1 items-center">
    <component :is="icon" class="w-6 h-6" :class="iconClass" />
    <a :href="href" :class="linkClass" target="_blank" rel="noopener noreferrer">
      <slot />
    </a>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  href: string;
  linkClass?: string;
  iconClass?: string;
}>();

const github = resolveComponent("github");
const twitter = resolveComponent("twitter");
const twitch = resolveComponent("twitch");
const youtube = resolveComponent("youtube");
const discord = resolveComponent("discord");
const link = resolveComponent("website");

const icon = computed(() => {
  const href = props.href;
  if (href.includes("github.com")) return github;
  if (href.includes("twitter.com") || href.includes("x.com")) return twitter;
  if (href.includes("twitch.tv")) return twitch;
  if (href.includes("youtube.com")) return youtube;
  if (href.includes("discord.gg")) return discord;
  return link;
});
</script>
