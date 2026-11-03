<template>
  <div class="relative">
    <Combobox v-model="selected">
      <ComboboxInput
        @change="searchQuery = $event.target.value"
        :display-value="(val: any) => val || searchQuery"
        class="block w-full border bg-stone-200 dark:bg-stone-600 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
        :class="inputClass"
        :placeholder="placeholder"
        autocomplete="off"
      />
      <Spinner
        v-if="isLoading"
        class="absolute right-3 top-[10px] z-20 text-black dark:text-white"
      />
      <ComboboxOptions
        v-if="results.length > 0"
        class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[200px] min-w-[200px] w-full overflow-y-auto z-10 rounded-b-md"
      >
        <ComboboxOption
          v-for="user in results"
          :key="user.user_id"
          :value="user.username"
          v-slot="{ active }"
        >
          <div
            class="cursor-pointer p-2 flex items-center gap-2"
            :class="{ 'bg-stone-300 dark:bg-stone-700': active }"
          >
            <Avatar :value="user.avatar" size="xs" class="border-stone-800" />
            <div class="flex flex-col">
              <span class="text-sm">{{ user.display_name }}</span>
              <span class="text-xs text-stone-500 dark:text-stone-400">@{{ user.username }}</span>
            </div>
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

type SearchUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
};

defineProps<{
  inputClass?: string;
  placeholder?: string;
}>();

const emit = defineEmits(["select"]);

const searchQuery = ref("");
const isLoading = ref(false);
const results = ref<SearchUser[]>([]);

const selected = computed({
  get: () => searchQuery.value,
  set: (val: string) => {
    searchQuery.value = val;
    results.value = [];
    emit("select", val);
  },
});

watchDebounced(
  searchQuery,
  async (query) => {
    if (!query || query.length < 2) {
      results.value = [];
      return;
    }
    isLoading.value = true;
    try {
      results.value = await $fetch<SearchUser[]>("/api/admin/search-users", {
        query: { query },
      });
    } catch {
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  },
  { debounce: 300 }
);

function clear() {
  searchQuery.value = "";
  results.value = [];
}

defineExpose({ clear });
</script>
