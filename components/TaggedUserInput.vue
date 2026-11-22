<template>
  <div class="relative">
    <Combobox v-model="value">
      <ComboboxInput
        @focus="emit('inputFocused')"
        @blur="emit('inputBlurred')"
        @change="value = $event.target.value"
        class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
        :class="inputClass"
        :placeholder="placeholder"
      />
      <!--
        No v-if on ComboboxOptions: filteredPeople always contains at least the
        typed value, so a length check was always true, but it forced every
        input to filter and sort the full user list on each change.
        ComboboxOptions only renders (and computes the list) while open.
      -->
      <Transition @afterLeave="emit('optionSelected')">
        <ComboboxOptions
          class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[150px] min-w-[200px] w-full overflow-y-scroll overflow-x-hidden z-10"
          :class="{
            'bottom-8': renderListOnTop,
          }"
        >
          <ComboboxOption
            v-for="person in filteredPeople"
            :key="person.key"
            :value="person.username"
          >
            <div
              class="cursor-pointer p-1 flex gap-2 overflow-ellipsis whitespace-nowrap"
            >
              <Avatar :value="person.avatar" size="xs" />
              <div class="flex flex-col gap-1">
                <span>{{ person.display_name }}</span>
                <span class="text-xs text-stone-400">{{
                  person.username
                }}</span>
              </div>
            </div>
          </ComboboxOption>
          <li
            v-if="hiddenMatches > 0"
            class="p-1 text-xs text-stone-500 dark:text-stone-400 italic"
          >
            {{ hiddenMatches }} more, keep typing to narrow it down
          </li>
        </ComboboxOptions>
      </Transition>
    </Combobox>
  </div>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import { refDebounced } from "@vueuse/core";
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
  placeholder?: string;
}>();

const emit = defineEmits([
  "inputFocused",
  "inputBlurred",
  "optionSelected",
  "update:value",
]);

const value = computed({
  get: () => props.value,
  set: (newValue) => {
    emit("update:value", newValue);
  },
});

// The suggestions are filtered while the user pauses, not on every
// keystroke, and at most MAX_SUGGESTIONS are drawn: a short name ("a")
// matches hundreds of users, and drawing (or removing) that many options
// blocked the page for up to a second, so typed letters showed late. The
// user list is debounced too, because the grimoire's list changes with
// every keystroke (it leaves out names already in a seat). The typed text
// itself always updates at once.
const SEARCH_DELAY_MS = 150;
const MAX_SUGGESTIONS = 30;
const search = refDebounced(value, SEARCH_DELAY_MS);
const users = refDebounced(toRef(props, "users"), SEARCH_DELAY_MS);

const allMatches = computed(() => {
  const query = search.value.toLowerCase();
  const matches =
    query === ""
      ? users.value
      : users.value.filter(
          (user) =>
            user.display_name?.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        );
  const sorted = naturalOrder(matches)
    .orderBy("asc")
    .sort(["display_name", "username"]);
  if (query === "") return sorted;
  // Names that start with what was typed come first.
  const startsWith = (user: (typeof sorted)[number]) =>
    !!user.display_name?.toLowerCase().startsWith(query) ||
    user.username.toLowerCase().startsWith(query);
  return [...sorted.filter(startsWith), ...sorted.filter((user) => !startsWith(user))];
});

const matchingPeople = computed(() =>
  allMatches.value
    .slice(0, MAX_SUGGESTIONS)
    .map((user) => ({ ...user, key: `user:${user.user_id ?? ""}:${user.username}` }))
);

const hiddenMatches = computed(() => allMatches.value.length - matchingPeople.value.length);

const filteredPeople = computed(() => [
  { username: value.value, key: "typed" },
  ...matchingPeople.value,
]);
</script>

<style scoped>
[data-headlessui-state="active"] {
  @apply bg-stone-300 dark:bg-stone-700;
}
</style>
