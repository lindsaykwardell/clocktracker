<template>
  <component
    :is="is"
    class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem]"
    :class="fontSize"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps<{
  mode?: "input" | "select" | "textarea";
  fontSize?: "sm" | "md" | "lg" | "xl";
}>();

const is = computed(() => {
  switch (props.mode) {
    case "input":
      return "input";
    case "select":
      return "select";
    case "textarea":
      return "textarea";
    default:
      return "input";
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
</script>
