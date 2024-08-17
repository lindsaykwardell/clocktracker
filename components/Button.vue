<template>
  <component
    :is="is"
    class="text-center transition duration-150 dark:text-white font-bold rounded flex justify-center gap-4 items-center p-1"
    :class="computedClasses"
    :disabled="disabled"
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
  custom?: string;
  discord?: boolean;
  fontSize?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
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

const primary =
  "bg-purple-500 dark:bg-purple-800 hover:bg-purple-600 dark:hover:bg-purple-900-dark border border-transparent text-white";
const outline =
  "border border-purple-500 dark:border-purple-800  hover:bg-purple-600 dark:hover:bg-purple-900";
const secondary =
  "bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-700 border border-transparent";
const tertiary =
  "border border-transparent hover:bg-stone-400 dark:hover:bg-stone-700";
const danger =
  "border border-red-500 dark:border-red-900 hover:bg-red-600 dark:hover:bg-red-950";
const discord = "bg-discord hover:bg-discord-dark";

const colorScheme = computed(() => {
  if (props.custom) {
    return props.custom;
  } else
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

const disabledStyle = computed(() => {
  return props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
});

const computedClasses = computed(() => {
  return `${colorScheme.value} ${fontSize.value} ${disabledStyle.value}`;
});
</script>
