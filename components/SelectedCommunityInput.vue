<template>
  <div class="relative ">
    <Combobox v-model="value">
      <ComboboxInput
        @focus="emit('inputFocused')"
        @change="value = $event.target.value"
        :class="inputClass"
      />
      <ComboboxOptions
        v-if="filteredCommunities.length > 0"
        class="absolute text-sm bg-stone-900 border border-stone-500 max-h-[150px] min-w-[200px] w-full overflow-y-scroll overflow-x-hidden z-10"
      >
        <ComboboxOption
          class="cursor-pointer p-1 flex gap-2"
          v-for="community in filteredCommunities"
          :value="community.name"
        >
          <Avatar :value="community.icon" size="xs" />
          <div class="flex flex-col gap-1">
            <span>{{ community.name }}</span>
          </div>
        </ComboboxOption>
      </ComboboxOptions>
    </Combobox>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import naturalOrder from "natural-order";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";

const props = defineProps<{
  communities: {
    id: number | null;
    name: string;
    icon: string;
  }[];
  value: string;
  inputClass?: string;
}>();

const emit = defineEmits(["inputFocused", "update:value"]);

const value = computed({
  get: () => props.value,
  set: (newValue) => {
    emit("update:value", newValue);
  },
});

const filteredCommunities = computed(() =>
  naturalOrder(
    value.value === ""
      ? props.communities
      : props.communities.filter((c) => {
          return c.name?.toLowerCase().includes(value.value.toLowerCase());
        })
  )
    .orderBy("asc")
    .sort(["display_name", "username"])
);
</script>

<style>
[data-headlessui-state="active"] {
  @apply bg-stone-700;
}
</style>
