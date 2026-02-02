<template>
  <div ref="element">
    <TaggedUserInput
      :users="users"
      :renderListOnTop="renderListOnTop"
      :inputClass="inputClass"
      v-model:value="value"
      @inputFocused="emit('inputFocused')"
      @inputBlurred="emit('inputBlurred')"
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
  highlightTagged?: boolean;
}>();

const emit = defineEmits(["inputFocused", "inputBlurred", "update:value"]);

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

const inputClass = computed(() =>
  [
    "w-20",
    "md:w-28",
    "text-xs",
    "md:text-sm",
    props.highlightTagged ? "tag-match" : "",
  ].join(" ")
);
</script>

<style>
  .tag-match {
    border: 2px solid theme(colors.purple.700) !important;
    font-weight: 600;
  }
</style>
