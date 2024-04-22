<template>
  <textarea
    ref="textarea"
    v-model="input"
    class="block w-full border bg-stone-300 dark:bg-stone-600 disabled:bg-stone-400 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem]"
  ></textarea>
</template>

<script setup lang="ts">
import { useTextareaAutosize } from "@vueuse/core";

const { textarea, input } = useTextareaAutosize();

const props = defineProps<{
  modelValue: string;
}>();
const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

watch(input, () => {
  value.value = input.value;
});

watch(value, () => {
  if (input.value !== value.value) input.value = value.value;
});

onMounted(() => {
  input.value = value.value;
});
</script>

<style scoped>
textarea {
  resize: none;
}
</style>
