<template>
  <div>
    <Combobox v-model="value">
      <ComboboxInput
        @focus="emit('inputFocused')"
        @change="value = $event.target.value"
        class="w-20 md:w-28 bg-stone-600 rounded p-1 border-2 border-stone-500 text-center text-xs md:text-sm"
      />
      <ComboboxOptions
        class="text-sm bg-stone-900 border border-stone-500 relative max-h-[150px] overflow-scroll"
        :class="{
          'transform -translate-y-full bottom-8': renderListOnTop,
        }"
      >
        <ComboboxOption
          class="cursor-pointer hover:bg-stone-700 p-1 flex gap-2"
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
import { ref, computed } from "vue";
import naturalOrder from "natural-order";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";
import { User } from "~/composables/useUsers";

const props = defineProps<{
  users: User[];
  value: string;
  renderListOnTop?: boolean;
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
