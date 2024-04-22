<template>
  <Switch
    v-model="value"
    :class="{
      'bg-purple-500 dark:bg-purple-800': value,
      'bg-purple-900 dark:bg-purple-950': !value,
      'h-[24px] w-[60px]': !props.size || props.size === 'md',
      'h-[16px] w-[36px]': props.size === 'sm',
    }"
    class="relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
  >
    <span class="sr-only">Use setting</span>
    <span
      aria-hidden="true"
      :class="{
        'translate-x-9': (!props.size || props.size === 'md') && value,
        'translate-x-5': props.size === 'sm' && value,
        'translate-x-0': !value,
        'h-[20px] w-[20px]': !props.size || props.size === 'md',
        'h-[12px] w-[12px]': props.size === 'sm',
      }"
      class="pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
    />
  </Switch>
</template>

<script setup lang="ts">
import { Switch } from "@headlessui/vue";

const props = defineProps<{ modelValue: boolean; size?: "sm" | "md" }>();
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
