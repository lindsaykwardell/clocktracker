<template>
  <nuxt-link
    v-if="isDecemberOrJanuary"
    component="nuxt-link"
    to="/year-in-review"
    id="year-in-review"
    class="ct-btn-yir"
  >
    <img 
      :src="`/img/ui/fanggu_large_purple.webp`" 
      class="absolute right-2 top-0 w-[6.75rem] h-[6.75rem] opacity-80" 
    />
    <span>Year in Review</span>
    <span>View your stats of this passed year!</span>
  </nuxt-link>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const isDecemberOrJanuary = computed(() => dayjs().month() === 0 || dayjs().month() === 11);
</script>

<style scoped>
  :where(.ct-btn-yir) {
    width: unset
  }

  .ct-btn-yir {
    @apply relative overflow-hidden flex w-full flex-col justify-center items-start;
    @apply rounded; 
    @apply font-gothic;
    @apply transition duration-150;

    --size: calc(var(--tailwind-spacing) * 22);
    --btn-bg: var(--btn-color, var(--color-base-200));
    --btn-color: theme(colors.primary);
    --btn-fg: theme(colors.primary-content);
    --btn-p: 1.5rem 5rem;
    --btn-border: var(--btn-bg);
    --btn-shadow: 0 3px 2px -2px var(--btn-bg),0 4px 3px -2px var(--btn-bg);

    cursor: pointer;
    vertical-align: middle;
    outline-offset: 2px;
    color: var(--btn-fg);
    height: var(--size);
    outline-color: var(--btn-color, var(--color-base-content));
    background-color: var(--btn-bg);
    text-shadow: 0 .5px oklch(100% 0 0 / calc(var(--depth) * .15));
    touch-action: manipulation;
    box-shadow: 0 .5px 0 .5px oklch(100% 0 0 / calc(var(--depth) * 6%)) inset, var(--btn-shadow);
    flex-shrink: 0;
    padding-inline: var(--btn-p);
    border-width: var(--border);
    border-style: solid;
    border-color: var(--btn-border);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url('/img/ui/yir_bg.webp');
      background-repeat: none;
      background-size: cover;
      opacity: 0.3;
    }

    &:where(.dark, .dark *) {
      --btn-color: theme(colors.dark-primary);
    }

    > span:first-of-type {
      font-size: 1.125rem;
      font-weight: 600;
      position: relative;
      z-index: 1;
    }

    > span:last-of-type {
      font-size: 0.75rem;
      text-wrap: balance;
      position: relative;
      z-index: 1;
    }
  }

  @supports (color: color-mix(in lab,red,red)) {
    .ct-btn-yir {
      --btn-border: color-mix(in oklab, var(--btn-bg), #000 calc(var(--depth) * 5%));
      --btn-shadow: 0 3px 2px -2px color-mix(in oklab, var(--btn-bg) calc(var(--depth) * 30%), #0000), 0 4px 3px -2px color-mix(in oklab, var(--btn-bg)calc(var(--depth) * 30%), #0000);
    }
  }


  /* Hover state */
  @media(hover: hover) {
    .ct-btn-yir:hover {
      --btn-bg: var(--btn-color, var(--color-base-200));
    }

    @supports (color: color-mix(in lab, red, red)) {
      .ct-btn-yir:hover {
        --btn-bg: color-mix(in oklab, var(--btn-color, var(--color-base-200)), #000 7%);
      }
    }
  }


  /* Focus state */
  .ct-btn-yir:focus-visible,
  .ct-btn-yir:has(:focus-visible) {
      isolation: isolate;
      outline-width: 2px;
      outline-style: solid;
  }
</style>

