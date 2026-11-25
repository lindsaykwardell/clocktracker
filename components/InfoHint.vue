<template>
  <VTooltip class="inline-flex align-middle" :container="container ?? 'body'">
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
 *
 * Inside a modal dialog, pass `container="dialog[open] [data-dialog-content]"`:
 * the tooltip goes on the page body by default, which the open dialog
 * covers. Not `dialog[open]` itself: a tooltip there sits outside the
 * dialog's content, so clicking it closes the dialog, and Vue can't reopen it.
 */
defineProps<{ label: string; content?: string; container?: string }>();
</script>
