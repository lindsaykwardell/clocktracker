<template>
  <Button
    component="a"
    id="discord"
    href="https://discord.gg/KwMz8ThamT"
    title="Join the ClockTracker Discord server"
    variant="soft"
    icon="discord"
    :size="size"
    display="icon-only"
  >
    Discord
  </Button>
  <Button
    component="a"
    id="bluesky"
    href="https://bsky.app/profile/clocktracker.app"
    title="Join the ClockTracker conversation on Bluesky"
    variant="soft"
    icon="bluesky"
    :size="size"
    display="icon-only"
  >
    Bluesky
  </Button>
  <Button
    component="a"
    id="kofi"
    href="https://ko-fi.com/clocktracker"
    title="Donate to ClockTracker"
    variant="soft"
    icon="kofi"
    :size="size"
    display="icon-only"
  >
    Ko-Fi
  </Button>
  <Button
    component="a"
    id="github"
    href="https://github.com/lindsaykwardell/clocktracker"
    title="View the ClockTracker source code"
    variant="soft"
    icon="github"
    :size="size"
    display="icon-only"
  >
    Github
  </Button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: "xs" | "lg";
}>(),
  { 
    size: "lg",
  }
);
</script>