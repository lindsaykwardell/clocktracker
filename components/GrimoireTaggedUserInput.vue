<template>
  <div ref="element">
    <TaggedUserInput
      :users="users"
      :renderListOnTop="renderListOnTop"
      v-model:value="value"
      @inputFocused="emit('inputFocused')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { User } from "~/composables/useUsers";

const props = defineProps<{
  users: User[];
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
