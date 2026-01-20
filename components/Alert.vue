<template>
  <component
    :is="is"
    class="ct-alert"
    :class="{
      [computedClasses]: true,
    }"
  >
    <IconUI v-if="iconId" :id="iconId" size="lg" />
    <span class="max-width-[80ch]">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
  const props = withDefaults(
  defineProps<{
    component?: string;
    color?: "info" | "positive" | "caution" | "negative";
    icon?: string;
  }>(),
  { 
    color: "info",
  }
  );

  const is = computed(() => {
  switch (props.component) {
    case undefined:
    return "div";
    default:
    return props.component;
  }
  });

  const iconId = computed(() => {
    if(props.icon) {
        return props.icon;
    } else {
      switch (props.color) {
        case "info":
        return "check";
        case "positive":
        return "check";
        case "caution":
        return "check";
        case "negative":
        return "check";
        default:
        return "";
      }
    }
  });

  const colorClass = computed(() => {
    return `ct-alert-${props.color}`;
  });

  const computedClasses = computed(() => {
    return `${colorClass.value}`;
  });
</script>

<style scoped>
  .ct-alert {
    @apply flex items-center;

    --alert-p: .5rem;
    --alert-bg: color-mix(in oklab, var(--alert-color, var(--color-base-content)) 15%, var(--color-base-100));
    --alert-fg: var(--alert-color);

    color: var(--alert-fg);
    background: var(--alert-bg);
    padding-inline: calc(var(--alert-p) * 2);
    padding-block: var(--alert-p);
    gap: 0.5rem;

    &-info {
      --alert-color: theme(colors.blue.800);

      &:where(.dark, .dark *) {
        --alert-color: theme(colors.blue.400);
      }
    }

    &-positive {
      --alert-color: theme(colors.green.800);
    }

    &-caution {
      --alert-color: theme(colors.amber.800);

      &:where(.dark, .dark *) {
        --alert-color: theme(colors.amber.400);
      }
    }

    &-negative {
      --alert-color: theme(colors.red.800);

      &:where(.dark, .dark *) {
        --alert-color: theme(colors.red.400);
      }
    }
  }
</style>