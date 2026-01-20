<template>
  <component
    :is="is"
    :class="{
      [computedClasses]: true,
      'font-medium': bold,
    }"
  >
    <IconUI v-if="iconId" :id="iconId" :size="iconSize" />
    <slot />
  </component>
</template>

<script setup lang="ts">
  const props = withDefaults(
  defineProps<{
    component?: string;
    color?: "primary" | "neutral" | "positive" | "caution" | "negative" | "scripts" | "games" | "admins" | "digital";
    size?: "xs" | "sm-md" | "sm" | "md" | "lg";
    variant?: "filled" | "soft" | "overlay";
    icon?: string;
    display?: "icon-before" | "icon-only" | "icon-after";
    bold?: boolean;
  }>(),
  { 
    variant: "filled",
    color: "neutral",
    size: "md",
  }
  );

  const is = computed(() => {
  switch (props.component) {
    case undefined:
    return "span";
    default:
    return props.component;
  }
  });

  const iconId = computed(() =>
    props.icon
  );

  const iconSize = computed(() => {
    switch (props.size) {
      case "xs":
        return "xs";
      case "sm-md":
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      default:
        return "md";
    }
  });

  const variantClass = computed(() => {
    return `ct-badge-${props.variant}`;
  });

  const colorClass = computed(() => {
    return `ct-badge-${props.color}`;
  });

  const sizeClass = computed(() => {
    switch (props.size) {
      case "xs":
        return "ct-badge-xs";
      case "sm-md":
        return "ct-badge-sm-md";
      case "sm":
        return "ct-badge-sm";
      case "lg":
        return "ct-badge-lg";
      default:
        return "";
    }
  });

  const computedClasses = computed(() => {
    return `ct-badge ${variantClass.value} ${colorClass.value} ${sizeClass.value}`;
  });
</script>

<style scoped>
  .ct-badge {
    @apply inline-flex flex-none items-center justify-center;
    @apply font-gothic font-medium;
    @apply rounded-sm;

    --size: calc(var(--tailwind-spacing) * 8);
    --badge-p: .5rem;
    --badge-gap: 0.375rem;
    --badge-bg: var(--badge-color, var(--color-base-content));
    --badge-fg: color-mix(in oklab, var(--badge-color, var(--color-base-content)) 5%, var(--color-base-100));

    color: var(--badge-fg);
    background: var(--badge-bg);
    height: var(--size);
    min-inline-size: var(--size);
    font-size: var(--fontsize, 1rem);
    padding-inline: var(--badge-p);
    gap: var(--badge-gap);

    /* For testing purposes */
    /* --badge-color: hotpink !important; */

    &-primary {
      --badge-color: theme(colors.primary);

      
      &:where(.dark, .dark *) {
        --badge-color: theme(colors.purple.400);
      }
    }

    &-neutral {
      /* @apply text-gray-800 bg-stone-200 dark:bg-black/40 dark:text-white; */
      --badge-color: theme(colors.stone.800);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.stone.400);
      }
    }

    &-positive {
      --badge-color: theme(colors.green.800);
    }

    &-caution {
      --badge-color: theme(colors.amber.800);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.amber.400);
      }
    }

    &-negative {
      --badge-color: theme(colors.red.800);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.red.400);
      }
    }

    &-scripts {
      --badge-color: theme(colors.blue.800);
    }

    &-games {
      --badge-color: theme(colors.primary);
    }

    &-admins {
      --badge-color: theme(colors.green.800);
    }

    &-digital {
      --badge-color: theme(colors.digital);
    }
  }

  .ct-badge-soft {
    --badge-fg: var(--badge-color, var(--color-base-content));
    --badge-bg: var(--badge-color, var(--color-base-content));
  }

  .ct-badge-overlay {
    --badge-bg: color-mix(in oklab, var(--badge-color, var(--color-base-content)) 60%, transparent);
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-badge-soft {
      --badge-bg: color-mix(in oklab, var(--badge-color, var(--color-base-content)) 15%, var(--color-base-100));
    }
  }

  /* Size */

  .ct-badge-xs {
    --fontsize: .75rem;
    --badge-p: .25rem;
    --badge-gap: .25rem;
    --size: calc(var(--tailwind-spacing) * 5);
  }

  .ct-badge-sm {
    --fontsize: .875rem;
    --badge-p: .375rem;
    --size: calc(var(--tailwind-spacing) * 6);
  }

  .ct-badge-md {
    --fontsize: .1rem;
    --badge-p: .5rem;
    --size: calc(var(--tailwind-spacing) * 8);
  }

  .ct-badge-lg {
    --fontsize: 1.125rem;
    --badge-p: .625rem;
    --size: calc(var(--tailwind-spacing) * 10);
  }
</style>