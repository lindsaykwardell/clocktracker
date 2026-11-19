<template>
  <div ref="element">
    <TaggedUserInput
      :users="users"
      :renderListOnTop="renderListOnTop"
      :inputClass="inputClass"
      v-model:value="value"
      @inputFocused="onInputFocused"
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

// Open the suggestion list upward when the input is too close to the bottom
// of the grimoire for the list (max 150px) to fit below it. Measured on every
// focus: seats move when the page or player count changes, and this component
// is reused, so a value measured once at mount goes stale.
const renderListOnTop = ref(false);

function measureListDirection() {
  const grimoire = document.querySelector("#grimoire");
  const input = element.value as HTMLElement | undefined;
  if (!grimoire || !input) return;
  const spaceBelow =
    grimoire.getBoundingClientRect().bottom -
    input.getBoundingClientRect().bottom;
  renderListOnTop.value = spaceBelow < 150;
}

function onInputFocused() {
  measureListDirection();
  emit("inputFocused");
}

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
