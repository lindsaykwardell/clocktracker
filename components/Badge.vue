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
    circular?: boolean;
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

  const shapeClass = computed(() => {
    if (props.circular) {
      return "ct-badge-circle";
    }
    else {
      return "";
    }
  });

  const computedClasses = computed(() => {
    return `ct-badge ${variantClass.value} ${colorClass.value} ${sizeClass.value} ${shapeClass.value}`;
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
    --badge-fg: color-mix(in oklab, var(--color-base-content) 95%, var(--badge-color));

    color: var(--badge-fg);
    background: var(--badge-bg);
    height: var(--size);
    min-inline-size: var(--size);
    font-size: var(--fontsize, 1rem);
    padding-inline: var(--badge-p);
    gap: var(--badge-gap);

    /* For testing purposes */
    /* --badge-color: hotpink !important; */

    &-primary ,
    &-games {
      --badge-color: theme(colors.primary);
      --badge-fg: theme(colors.primary-content);
      
      &:where(.dark, .dark *) {
        --badge-color: theme(colors.purple.400);
        --badge-fg: theme(colors.purple.900);
      }
    }

    &-neutral {
      /* @apply text-gray-800 bg-stone-200 dark:bg-black/40 dark:text-white; */
      --badge-color: theme(colors.stone.800);
      --badge-fg: theme(colors.stone.200);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.stone.400);
        --badge-fg: theme(colors.stone.950);
      }
    }

    &-positive,
    &-admins {
      --badge-color: theme(colors.green.800);
      --badge-fg: theme(colors.green.100);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.green.400);
        --badge-fg: theme(colors.green.950);
      }
    }

    &-caution {
      --badge-color: theme(colors.amber.800);
      --badge-fg: theme(colors.amber.100);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.amber.400);
        --badge-fg: theme(colors.amber.950);
      }
    }

    &-negative {
      --badge-color: theme(colors.red.800);
      --badge-fg: theme(colors.red.100);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.red.400);
        --badge-fg: theme(colors.red.950);
      }
    }

    &-scripts {
      --badge-color: theme(colors.blue.800);
      --badge-fg: theme(colors.blue.100);

      &:where(.dark, .dark *) {
        --badge-color: theme(colors.blue.400);
        --badge-fg: theme(colors.blue.950);
      }
    }

    &-digital {
      --badge-color: theme(colors.digital);
      --badge-fg: color-mix(in oklab, theme(colors.digital), #ffffff 90%);

      &:where(.dark, .dark *) {
        --badge-fg: color-mix(in oklab, theme(colors.digital), #000000 90%);
      }
    }
  }

  .ct-badge-soft,
  .ct-badge-overlay {
    --badge-fg: var(--badge-color, var(--color-base-content));
    --badge-bg: var(--badge-color, var(--color-base-content));
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-badge-soft {
      --badge-bg: color-mix(in oklab, var(--badge-color, var(--color-base-content)) 15%, var(--color-base-100));

      &:where(.dark, .dark *) {
        --badge-fg: color-mix(in oklab, var(--badge-color), #ffffff 5%);
      }
    }
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-badge-overlay {
      --badge-bg: color-mix(in oklab, var(--badge-color, var(--color-base-content)) 20%, transparent);
      --badge-fg: color-mix(in oklab, var(--badge-color), #ffffff 85%);
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

  /* Shape */
  .ct-badge-circle {
    --depth: 0;

    width: var(--size);
    height: var(--size);
    padding-inline: 0;
    border-radius: 50%;
  }
</style>