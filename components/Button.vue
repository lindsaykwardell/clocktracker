<template>
  <component
    :is="is"
    class="text-center transition duration-150 text-white font-bold rounded flex justify-center gap-4 items-center cursor-pointer p-1"
    :class="computedClasses"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps<{
  component?: string;
  primary?: boolean;
  outline?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  danger?: boolean;
  discord?: boolean;
  fontSize?: "sm" | "md" | "lg" | "xl";
}>();

const nuxtLink = resolveComponent("nuxt-link");

const is = computed(() => {
  switch (props.component) {
    case "nuxt-link":
      return nuxtLink;
    case undefined:
      return "button";
    default:
      return props.component;
  }
});

const primary = "bg-primary hover:bg-primary-dark border border-transparent";
const outline = "border border-primary  hover:bg-primary-dark";
const secondary =
  "bg-secondary hover:bg-secondary-dark border border-transparent";
const tertiary = "border border-transparent hover:bg-secondary-dark";
const danger = "border border-danger bg-danger hover:bg-danger-dark";
const discord = "bg-discord hover:bg-discord-dark";

const colorScheme = computed(() => {
  if (props.primary) {
    return primary;
  } else if (props.outline) {
    return outline;
  } else if (props.secondary) {
    return secondary;
  } else if (props.tertiary) {
    return tertiary;
  } else if (props.danger) {
    return danger;
  } else if (props.discord) {
    return discord;
  } else {
    return secondary;
  }
});

const fontSize = computed(() => {
  switch (props.fontSize) {
    case "sm":
      return "text-sm";
    case "md":
      return "text-base";
    case "lg":
      return "text-lg";
    case "xl":
      return "text-xl";
    default:
      return "text-lg";
  }
});

const computedClasses = computed(() => {
  return `${colorScheme.value} ${fontSize.value}`;
});
</script>
