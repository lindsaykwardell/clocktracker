<template>
  <component
    :is="is"
    :class="{
      [computedClasses]: true,
      'ct-btn-tag': removableTag,
      'font-semibold': !removableTag,
      'w-full max-w-[16rem]': wide,
      'ct-btn-active': active,
      'ct-btn-image': image,
    }"
    :disabled="disabled || undefined"
  >
    <template v-if="image">
      <img 
        :src="`/img/ui/${image}.webp`" 
        class="w-7 h-7 p-[0.125rem]" 
        :class="{
          'bg-white rounded-full': color !== 'neutral',
        }"
      />
      <slot />
    </template>
    <template v-else>
      <IconUI v-if="iconId && displayMode === 'icon-before'" :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
      <template v-if="iconId && displayMode === 'icon-only'">
        <span class="sr-only">
          <slot />
        </span>
        <IconUI :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
      </template>
      <template v-else>
        <slot />
      </template>
      <IconUI v-if="iconId && displayMode === 'icon-after'" :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
      <Badge
        v-if="props.count"
        color="negative"
        :aria-label="countLabel"
        circular
        size="sm"
      >
        {{ props.count }}
      </Badge>
    </template>
    
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    component?: string;
    disabled?: boolean;
    active?: boolean;
    variant?: "filled" | "soft" | "outline" | "link" | "link-underline";
    size?: "xs" | "xs-sm" | "sm-md" | "sm" | "md" | "lg";
    color?: "primary" | "secondary" | "neutral" | "neutral-on-dark" | "contrast" | "black" | "positive" | "caution" | "negative" | "discord" | "bgg";
    wide?: boolean;
    circular?: boolean;
    removableTag?: boolean;
    icon?: string;
    iconSize?: string;
    iconSpin?: boolean;
    iconColor?: "primary" | "neutral" | "positive" | "caution" | "negative" | "bgg";
    display?: "icon-before" | "icon-only" | "icon-after";
    image?: string;
    count?: string | number;
    countLabel?: string;
}>(),
  { 
    variant:"filled",
    color: "neutral",
    size: "md",
    display: "icon-before",
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
})

const variantClass = computed(() => {
  return `ct-btn-${props.variant}`;
});

const colorClass = computed(() => {
  return `ct-btn-${props.color}`;
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "ct-btn-xs";
    case "xs-sm":
      return "ct-btn-xs-sm";  
    case "sm-md":
      return "ct-btn-sm-md";
    case "sm":
      return "ct-btn-sm";
    case "lg":
      return "ct-btn-lg";
    default:
      return "";
  }
});

const shapeClass = computed(() => {
  if (props.display === 'icon-only') {
    if (props.circular) {
      return "ct-btn-circle";
    } else {
      return "ct-btn-square";
    }
  }
  else {
    return "";
  }
});

const iconId = computed(() =>
  props.removableTag ? "x" : props.icon
);

const iconSize = computed(() => {
  if (props.removableTag) {
    return "md";
  }
  else if (props.iconSize) {
    return props.iconSize;
  }
  else {
    switch (props.size) {
      case "xs":
      case "xs-sm":
      case "sm-md":
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      default:
        return "md";
    }
  }
});

const displayMode = computed(() =>
  props.removableTag ? "icon-after" : props.display
);

const computedClasses = computed(() => {
  return `ct-btn ${variantClass.value} ${colorClass.value} ${sizeClass.value} ${shapeClass.value}`;
});
</script>

<style scoped>
  :where(.ct-btn) {
    width: unset
  }

  .ct-btn {
    @apply inline-flex flex-nowrap justify-center items-center;
    @apply rounded; 
    @apply font-gothic;
    @apply whitespace-nowrap; 
    @apply transition duration-150;

    --size: calc(var(--tailwind-spacing) * 10);
    --btn-bg: var(--btn-color, var(--color-base-200));
    --btn-fg: var(--color-base-content);
    --btn-p: 1rem;
    --btn-gap: 0.375rem;
    --btn-border: var(--btn-bg);
    --btn-shadow: 0 3px 2px -2px var(--btn-bg),0 4px 3px -2px var(--btn-bg);

    cursor: pointer;
    text-align: center;
    vertical-align: middle;
    outline-offset: 2px;
    color: var(--btn-fg);
    height: var(--size);
    font-size: var(--fontsize, .875rem);
    outline-color: var(--btn-color, var(--color-base-content));
    background-color: var(--btn-bg);
    text-shadow: 0 .5px oklch(100% 0 0 / calc(var(--depth) * .15));
    touch-action: manipulation;
    box-shadow: 0 .5px 0 .5px oklch(100% 0 0 / calc(var(--depth) * 6%)) inset, var(--btn-shadow);
    flex-shrink: 0;
    font-weight: 600;
    padding-inline: var(--btn-p);
    border-width: var(--border);
    border-style: solid;
    border-color: var(--btn-border);
    gap: var(--btn-gap);
  }


  /* Colors */
  .ct-btn {
    /* For testing purposes */
    /* --btn-color: greenyellow !important; */

    &-primary {
      --btn-color: theme(colors.primary);
      --btn-fg: theme(colors.primary-content);

      &:where(.dark, .dark *) {
        --btn-color: theme(colors.dark-primary);
      }
    }

    &-contrast {
      --btn-color: theme(colors.white);
      --btn-fg: theme(colors.black);

      &:where(.dark, .dark *) {
        --btn-color: theme(colors.black);
        --btn-fg: theme(colors.white);
      }

      &:hover {
        --btn-color: theme(colors.primary);
        --btn-fg: theme(colors.primary-content);
      }
    }

    &-black {
      --btn-color: theme(colors.black);
      --btn-fg: theme(colors.white);

      &:hover {
        --btn-color: theme(colors.primary);
        --btn-fg: theme(colors.primary-content);
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
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn {
      --btn-border: color-mix(in oklab, var(--btn-bg), #000 calc(var(--depth) * 5%));
      --btn-shadow: 0 3px 2px -2px color-mix(in oklab, var(--btn-bg) calc(var(--depth) * 30%), #0000), 0 4px 3px -2px color-mix(in oklab, var(--btn-bg)calc(var(--depth) * 30%), #0000);
    }
  }


  /* Hover state */
  @media(hover: hover) {
    .ct-btn:hover {
      --btn-bg: var(--btn-color, var(--color-base-200));
    }

    @supports (color: color-mix(in lab, red, red)) {
      .ct-btn:hover {
        --btn-bg: color-mix(in oklab, var(--btn-color, var(--color-base-200)), #000 7%);
      }
    }
  }


  /* Focus state */
  .ct-btn:focus-visible,
  .ct-btn:has(:focus-visible) {
      isolation: isolate;
      outline-width: 2px;
      outline-style: solid;
  }


  /* Active state */
  .ct-btn:active:not(.ct-btn-active,.overlay-link,.game-link) {
    --btn-bg: var(--btn-color,var(--color-base-200));
    --btn-border: var(--btn-color, var(--color-base-200));
    --btn-shadow: 0 0 0 0 oklch(0% 0 0/0), 0 0 0 0 oklch(0% 0 0/0);
    translate: 0 .5px;
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn:active:not(.ct-btn-active) {
      --btn-bg: color-mix(in oklab, var(--btn-color, var(--color-base-200)), #000 5%);
      --btn-border:color-mix(in oklab, var(--btn-color, var(--color-base-200)), #000 7%);
    }
  }

  .ct-btn-active {
    --btn-bg: var(--btn-color,var(--color-base-200));
    --btn-shadow: 0 0 0 0 oklch(0% 0 0/0),0 0 0 0 oklch(0% 0 0/0);
      isolation: isolate;
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn-active {
      --btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-200)),#000 7%)
    }
  }


  /* Disabled */
  .ct-btn:disabled:not(.ct-btn-link),
  .ct-btn[disabled]:not(.ct-btn-link),
  .ct-btn-disabled:not(.ct-btn-link) {
    background-color: var(--color-base-content);
    box-shadow: none;
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn:disabled:not(.ct-btn-link),
    .ct-btn[disabled]:not(.ct-btn-link),
    .ct-btn-disabled:not(.ct-btn-link) {
      background-color:color-mix(in oklab,var(--color-base-content)10%,transparent)
    }
  }

  .ct-btn:disabled,
  .ct-btn[disabled],
  .ct-btn-disabled {
    pointer-events: none;
    --btn-border: #0000;
    --btn-noise: none;
    --btn-fg: var(--color-base-content)
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn:disabled,
    .ct-btn[disabled],
    .ct-btn-disabled {
      --btn-fg: color-mix(in oklch, var(--color-base-content) 20%, #0000)
    }
  }


  /* Size */
  .ct-btn-xs,
  .ct-btn-xs-sm {
    --fontsize: .6875rem;
    --btn-p: .5rem;
    --size: calc(var(--tailwind-spacing) * 6);
  }

  .ct-btn-sm,
  .ct-btn-sm-md {
    --fontsize: .75rem;
    --btn-p: .75rem;
    --size: calc(var(--tailwind-spacing) * 8);
  }

  .ct-btn-md {
    --fontsize: .875rem;
    --btn-p: 1rem;
    --size: calc(var(--tailwind-spacing) * 10);
  }

  .ct-btn-md {
    --fontsize: .875rem;
    --btn-p: 1rem;
    --size: calc(var(--tailwind-spacing) * 10);
  }

  @media(min-width: 48rem) {
    .ct-btn-xs-sm {
      --fontsize: .75rem;
      --btn-p: .75rem;
      --size: calc(var(--tailwind-spacing) * 8);
    }

    .ct-btn-sm-md {
      --fontsize: .875rem;
      --btn-p: 1rem;
      --size: calc(var(--tailwind-spacing) * 10);
    }
  }

  .ct-btn-lg {
    --fontsize: 1.125rem;
    --btn-p: 1.25rem;
    --size: calc(var(--tailwind-spacing) * 12);
  }

  .ct-btn-xl {
    --fontsize: 1.375rem;
    --btn-p: 1.5rem;
    --size: calc(var(--tailwind-spacing) * 14);
  }

  .ct-btn-tag {
    --btn-p: .5rem;
    --btn-gap: .125rem;
  }

  .ct-btn-image {
    --btn-p: .75rem 1rem;
    --btn-gap: .5rem;
  }


  /* Shape */
  .ct-btn-circle,
  .ct-btn-square {
    --depth: 0;

    width: var(--size);
    height: var(--size);
    padding-inline: 0;
  }

  .ct-btn-circle {
    border-radius: 50%;
  }


  /* Link  */
  .ct-btn-link,
  .ct-btn-link-underline {
    --btn-p: 0;
    --btn-border: #0000;
    --btn-bg: #0000;
    --btn-shadow: "";
    font-size: calc(var(--fontsize, .875rem) + .125rem);
    outline-color: currentColor;
    font-weight: normal;
    height: unset;
  }

  .ct-btn-link:hover,
  .ct-btn-link-underline {
    text-decoration-line: underline;
  }

  .ct-btn-link-underline:hover {
    text-decoration-line: none;
  }

  .ct-btn-link:not(.ct-btn-disabled,.ct-btn:disabled,.ct-btn[disabled]) {
    --btn-fg: var(--btn-color,var(--color-base-content));
  }

  .ct-btn-link:is(.ct-btn-active,:hover,:active:focus,:focus-visible) {
    --btn-border: #0000;
    --btn-bg: #0000;
  }


  /* Soft */
  .ct-btn-soft:not(.ct-btn-active,:hover,:active:focus,:focus-visible,:disabled,[disabled],.ct-btn-disabled) {
    --btn-shadow:"";
    --btn-fg: var(--btn-color,var(--color-base-content));
    --btn-bg: var(--btn-color,var(--color-base-content));
    --btn-border:var(--btn-color,var(--color-base-content));
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn-soft:not(.ct-btn-active,:hover,:active:focus,:focus-visible,:disabled,[disabled],.ct-btn-disabled) {
      --btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-content))8%,var(--color-base-100));
      --btn-border:color-mix(in oklab,var(--btn-color,var(--color-base-content))10%,var(--color-base-100));
    }
  }

  @media(hover: none) {
    .ct-btn-soft:not(.ct-btn-active,:active,:focus-visible):hover {
      --btn-shadow:"";
      --btn-fg: var(--btn-color,var(--color-base-content));
      --btn-bg: var(--btn-color,var(--color-base-content));
      --btn-border: var(--btn-color,var(--color-base-content));
    }

    @supports (color: color-mix(in lab,red,red)) {
      .ct-btn-soft:not(.ct-btn-active,:active,:focus-visible):hover {
        --btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-content))8%,var(--color-base-100));
        --btn-border:color-mix(in oklab,var(--btn-color,var(--color-base-content))10%,var(--color-base-100));
      }
    }
  }
</style>
