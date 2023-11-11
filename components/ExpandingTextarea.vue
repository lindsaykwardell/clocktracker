<template>
  <textarea ref="textarea" v-model="input"></textarea>
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
