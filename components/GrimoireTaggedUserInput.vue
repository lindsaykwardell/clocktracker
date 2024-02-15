<template>
  <div ref="element">
    <TaggedUserInput
      :users="users"
      :renderListOnTop="renderListOnTop"
      inputClass="w-20 md:w-28 bg-stone-600 rounded p-1 border-2 border-stone-500 text-center text-xs md:text-sm"
      v-model:value="value"
      @inputFocused="emit('inputFocused')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  users: {
    username: string;
    display_name?: string;
    user_id?: string | null;
    avatar?: string | null;
  }[];
  value: string;
}>();

const emit = defineEmits(["inputFocused", "update:value"]);

const element = ref();

const value = computed({
  get: () => props.value,
  set: (newValue) => {
    emit("update:value", newValue);
  },
});

const renderListOnTop = computed(() => {
  const grimoire = document.querySelector("#grimoire");
  const grimoireDistanceToBottom =
    grimoire?.getBoundingClientRect().bottom || 0;
  const distanceToBottom = element.value?.getBoundingClientRect().bottom;
  return grimoireDistanceToBottom - distanceToBottom < 150;
});
</script>
