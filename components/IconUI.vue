<template>
  <span
    :class="[
      'inline-flex items-center justify-center',
      props.size,
      {
        'icon-rounded rounded-full dark:bg-black dark:text-white': props.rounded,
        'hover:bg-purple-600 transition-colors duration-200 ease-in-out z-10': props.rounded && !noHover,
        'bg-black text-white': props.rounded && props.dark,
        'bg-white text-black': props.rounded && !props.dark,
        'shadow': props.rounded && props.shadow,
      }
    ]"
  >
    <component 
      :is="icon"
      width="16" 
      height="16" 
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden="true"
      class="ui-icon"
      :class="[
        `ui-icon-${props.id}`,
        props.class,
        props.size,
        colorScheme,
        {'animate-spin': spin },
      ]"
    />  
    
  </span>
</template>

<script setup lang="ts">
  import { uiIcons, type UiIconId } from "~/utils/uiIcons";

  const props = defineProps<{
    id: UiIconId;
    class?: string;
    rounded?: boolean;
    shadow?: boolean;
    dark?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xl5';
    spin?: boolean;
    color?: "primary" | "neutral" | "muted" | "positive" | "caution" | "negative" | "bgg" | "yellow";
    noHover?: boolean;
  }>();

  // Fall back to a crossed-out eye for an id that isn't in the map (only
  // possible for ids that bypass the type, e.g. from data).
  const icon = computed(() => uiIcons[props.id] ?? uiIcons["eye-slash"]);

  const colorClasses = {
    primary: "text-purple-700",
    neutral: "text-stone-700",
    muted: "text-stone-500",
    positive: "text-green-700",
    caution: "text-amber-700",
    negative: "text-red-700",
    bgg: "text-[#ff5100]",
    yellow: "text-yellow-400",
  } as const;

  const colorScheme = computed(() =>
    props.color ? colorClasses[props.color] : undefined
  );
</script>

<style scoped>
  span.icon-rounded {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    flex-shrink: 0;
    
    @apply w-6 h-6 md:w-8 md:h-8;

    &.sm {
      @apply w-4 h-4 md:w-6 md:h-6;
    }

    &.xs {
      @apply w-4 h-4 md:w-5 md:h-5;
    }
  }

  svg {
    inline-size: auto;
    @apply h-[0.875rem] md:h-[1.125rem];

    &.xl5 {
      @apply h-[2rem] md:h-[3rem];
    }

    &.xxl {
      @apply h-[1.75rem] md:h-[1.875rem];
    }

    &.xl {
      @apply h-[1.5rem] md:h-[1.75rem];
    }

    &.lg {
      @apply h-[1rem] md:h-[1.25rem];
    }

    &.sm {
      @apply h-[0.75rem] md:h-[.875rem];
    }

    &.xs {
      @apply h-[0.625rem] md:h-[.75rem];
    }
  }
</style>
