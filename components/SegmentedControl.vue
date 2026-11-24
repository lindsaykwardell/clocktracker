<template>
  <!-- Picks one of a few views of the same content: quieter than primary buttons. -->
  <div
    class="inline-flex shrink-0 p-[3px] gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-200 dark:bg-stone-800"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="modelValue === option.value"
      :disabled="option.disabled || undefined"
      :title="option.title"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
      :class="modelValue === option.value
        ? 'bg-white dark:bg-stone-600 text-primary dark:text-white shadow-sm'
        : 'text-stone-600 dark:text-stone-300 enabled:hover:text-stone-900 dark:enabled:hover:text-white'"
      @click="emit('update:modelValue', option.value)"
    >
      <IconUI v-if="option.icon" :id="option.icon" size="sm" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import type { UiIconId } from "~/utils/uiIcons";

defineProps<{
  modelValue: T;
  options: readonly { value: T; label: string; icon?: UiIconId; disabled?: boolean; title?: string }[];
  label: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>
