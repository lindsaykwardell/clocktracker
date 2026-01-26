<template>
  <component
    :is="is"
    :class="{
      [computedClasses]: true,
    }"
    :disabled="disabled"
  >
    <template v-if="image">
      <ImageUI 
        :image="image" 
        class="w-[14px]" 
      />
    </template>
    <template v-else>
      <IconUI v-if="iconId" :id="iconId" size="sm" :color="iconColor" :spin="iconSpin" />
    </template>
    <slot />
  </component>
</template>

<script setup lang="ts">
  const props = withDefaults(
  defineProps<{
    component?: string;
    disabled?: boolean;
    variant?: "filled" | "soft";
    color?: "primary" | "neutral" | "positive" | "caution" | "negative" | "discord" | "bgg" | "bgstats";
    icon?: string;
    iconSpin?: boolean;
    iconColor?: "primary" | "neutral" | "positive" | "caution" | "negative" | "bgg";
    image?: string;
  }>(),
  { 
    color: "neutral",
    variant: "soft",
  }
  );

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

  const iconId = computed(() =>
    props.icon
  );

  const colorClass = computed(() => {
    return `ct-btn-submenu-${props.color}`;
  });

  const variantClass = computed(() => {
    return `ct-btn-submenu-${props.variant}`;
  });

  const computedClasses = computed(() => {
    return `ct-btn-submenu ${variantClass.value} ${colorClass.value}`;
  });
</script>

<style scoped>
  .ct-btn-submenu {
    /* dark:text-white  */
    @apply flex items-center w-full;
    @apply font-gothic font-medium text-sm;
    @apply transition duration-150;
  }

  .ct-btn-submenu {
    --btn-bg: var(--btn-color, theme(colors.white));
    --btn-fg: var(--color-base-content);
    --btn-p: .5rem .75rem;
    --btn-gap: 0.375rem;

    cursor: pointer;
    vertical-align: middle;
    outline-offset: 2px;
    color: var(--btn-fg);
    font-size: var(--fontsize, .875rem);
    outline-color: var(--btn-color, var(--color-base-content));
    background-color: var(--btn-bg);
    touch-action: manipulation;
    flex-shrink: 0;
    padding: var(--btn-p);
    gap: var(--btn-gap);
  }

  /* Colors */
  .ct-btn-submenu {
    /* For testing purposes */
    /* --btn-color: cyan !important; */

    &-primary {
      --btn-color: theme(colors.primary);
      --btn-fg: theme(colors.primary-content);

      &:where(.dark, .dark *) {
        --btn-color: theme(colors.dark-primary);
      }
    }

    &-positive {
      --btn-color: theme(colors.positive);
      --btn-fg: theme(colors.positive-content);
    }

    &-caution {
      --btn-color: theme(colors.caution);
      --btn-fg: theme(colors.caution-content);
    }

    &-negative {
      --btn-color: theme(colors.negative);
      --btn-fg: theme(colors.negative-content);
    }

    &-discord {
      --btn-color: theme(colors.discord);
      --btn-fg: theme(colors.discord-content)
    }

    &-bgg {
      --btn-color: theme(colors.bgg-purple);
      --btn-fg: theme(colors.bgg-purple-content);
    }

    &-bgstats {
      --btn-color: theme(colors.bgstats-grey);
      --btn-fg: theme(colors.bgstats-grey-content);
    }
  }

  @media(hover: hover) {
    .ct-btn-submenu:hover {
      --btn-bg: var(--btn-color, var(--color-base-200));
    }

    @supports (color: color-mix(in lab, red, red)) {
      .ct-btn-submenu:hover {
        --btn-bg: color-mix(in oklab, var(--btn-color, var(--color-base-200)), #000 5%);
      }
    }
  }

  .ct-btn-submenu-soft:not(.ct-btn-submenu-active,:hover,:active:focus,:focus-visible,:disabled,[disabled],.ct-btn-submenu-disabled) {
    --btn-fg: var(--btn-color, var(--color-base-content));
    --btn-bg: var(--btn-color, theme(colors.white));
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn-submenu-soft:not(.ct-btn-submenu-active,:hover,:active:focus,:focus-visible,:disabled,[disabled],.ct-btn-submenu-disabled) {
      --btn-fg: color-mix(in oklab, var(--btn-color, var(--color-base-content)), #000 10%);
      --btn-bg: color-mix(in oklab, var(--btn-color, theme(colors.white)) 1%, theme(colors.white));
    }
  }

</style>