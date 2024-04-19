<template>
  <Switch
    v-model="value"
    :class="value ? 'bg-primary' : 'bg-primary-darkest'"
    class="relative inline-flex h-[24px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
  >
    <span class="sr-only">Use setting</span>
    <span
      aria-hidden="true"
      :class="value ? 'translate-x-9' : 'translate-x-0'"
      class="pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
    />
  </Switch>
</template>

<script setup lang="ts">
import { Switch } from "@headlessui/vue";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
