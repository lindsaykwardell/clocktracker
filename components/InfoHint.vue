<template>
  <VTooltip class="inline-flex align-middle">
    <button
      type="button"
      class="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      :aria-label="label"
    >
      <IconUI id="info-circle" size="sm" />
    </button>
    <template #popper>
      <div class="max-w-[280px] space-y-2 text-left">
        <slot>
          <div v-html="content" />
        </slot>
      </div>
    </template>
  </VTooltip>
</template>

<script setup lang="ts">
import { Tooltip as VTooltip } from "floating-vue";

/**
 * An (i) icon with an explanation in a tooltip, shown on hover, focus or tap
 * (the same tooltip as `v-tooltip`). The explanation is the default slot, or
 * `content` as HTML.
 */
defineProps<{ label: string; content?: string }>();
</script>
