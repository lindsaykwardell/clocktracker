<template>
  <div class="relative">
    <Combobox v-model="value">
      <ComboboxInput
        @focus="emit('inputFocused')"
        @change="value = $event.target.value"
        class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
        :class="inputClass"
        :placeholder="placeholder"
        aria-autocomplete="none"
        autocomplete="off"
      />
      <Spinner
        v-if="isLoading"
        class="absolute right-3 top-[10px] z-20 text-black"
      />
      <ComboboxOptions
        v-if="locations.length > 0"
        class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[150px] min-w-[200px] w-full overflow-y-scroll overflow-x-hidden z-10"
      >
        <ComboboxOption
          class="cursor-pointer p-1 flex gap-2 overflow-ellipsis whitespace-nowrap"
          v-for="location in locations"
          :value="location"
        >
          <div class="flex flex-col gap-1">
            <span>
              {{ location.name }}
            </span>
          </div>
        </ComboboxOption>
      </ComboboxOptions>
    </Combobox>
  </div>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";
import { watchDebounced } from "@vueuse/core";

type City = {
  id: number;
  name: string;
  latitute: number;
  longitude: number;
};

const props = defineProps<{
  value: string | null | undefined;
  inputClass?: string;
  placeholder?: string;
}>();

const emit = defineEmits(["inputFocused", "update:value"]);

const _value = ref<string | null | undefined>(props.value);
const isLoading = ref(false);

const value = computed({
  get: () => _value.value,
  set: (newValue: string | City) => {
    if (typeof newValue === "string") {
      _value.value = newValue;
    } else {
      _value.value = newValue.name;
      emit("update:value", newValue);
    }
  },
});

const locations = ref<City[]>([]);

watchDebounced(
  value,
  async (newValue) => {
    if (newValue && newValue.length > 2) {
      isLoading.value = true;
      const result = await $fetch<City[]>("/api/location", {
        query: {
          search: newValue,
        },
      });

      locations.value = result;
      isLoading.value = false;
    }
  },
  { debounce: 300 }
);
</script>

<style scoped>
[data-headlessui-state="active"] {
  @apply bg-stone-300 dark:bg-stone-700;
}
</style>
