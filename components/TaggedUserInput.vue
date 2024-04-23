<template>
  <div class="relative">
    <Combobox v-model="value">
      <ComboboxInput
        @focus="emit('inputFocused')"
        @change="value = $event.target.value"
        class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
        :class="inputClass"
      />
      <ComboboxOptions
        v-if="filteredPeople.length > 0"
        class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[150px] min-w-[200px] w-full overflow-y-scroll overflow-x-hidden z-10"
        :class="{
          'bottom-8': renderListOnTop,
        }"
      >
        <ComboboxOption
          class="cursor-pointer p-1 flex gap-2 overflow-ellipsis whitespace-nowrap"
          v-for="person in filteredPeople"
          :value="person.username"
        >
          <Avatar :value="person.avatar" size="xs" />
          <div class="flex flex-col gap-1">
            <span>{{ person.display_name }}</span>
            <span class="text-xs text-stone-400">{{ person.username }}</span>
          </div>
        </ComboboxOption>
      </ComboboxOptions>
    </Combobox>
  </div>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";

const props = defineProps<{
  users: {
    username: string;
    display_name?: string;
    user_id?: string | null;
    avatar?: string | null;
  }[];
  value: string;
  renderListOnTop?: boolean;
  inputClass?: string;
}>();

const emit = defineEmits(["inputFocused", "update:value"]);

const value = computed({
  get: () => props.value,
  set: (newValue) => {
    emit("update:value", newValue);
  },
});

const filteredPeople = computed(() =>
  naturalOrder(
    value.value === ""
      ? props.users
      : props.users.filter((user) => {
          return (
            user.display_name
              ?.toLowerCase()
              .includes(value.value.toLowerCase()) ||
            user.username.toLowerCase().includes(value.value.toLowerCase())
          );
        })
  )
    .orderBy("asc")
    .sort(["display_name", "username"])
);
</script>

<style>
[data-headlessui-state="active"] {
  @apply bg-stone-300 dark:bg-stone-700;
}
</style>
