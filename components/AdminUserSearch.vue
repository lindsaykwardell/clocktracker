<template>
  <!-- The same look as the user search on the feature flags page; picking a
       user fills in their username. -->
  <div class="relative">
    <Input
      v-model="value"
      :placeholder="placeholder ?? 'Search users by name or username...'"
      autocomplete="off"
      @input="onInput(($event.target as HTMLInputElement).value)"
      @blur="close"
      @keydown.esc="close"
    />
    <div
      v-if="results.length"
      class="absolute z-10 mt-1 w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg max-h-48 overflow-y-auto"
    >
      <!-- mousedown.prevent: keep the input focused, so its blur doesn't
           close the list before the click lands. -->
      <button
        v-for="u in results"
        :key="u.user_id"
        type="button"
        class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        @mousedown.prevent
        @click="pick(u)"
      >
        <Avatar :value="u.avatar" size="xs" class="border-stone-800" background />
        <span>{{ u.display_name }}</span>
        <span class="text-stone-400">@{{ u.username }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type SearchUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
};

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
});

const results = ref<SearchUser[]>([]);
let timer: ReturnType<typeof setTimeout> | undefined;
// Answers to an older search are dropped when a newer one was started.
let latest = 0;

// Reads the typed text from the event: the prop only catches up after the
// parent re-renders.
function onInput(text: string) {
  clearTimeout(timer);
  const query = text.trim();
  if (query.length < 2) {
    latest++;
    results.value = [];
    return;
  }
  timer = setTimeout(async () => {
    const request = ++latest;
    try {
      const found = await $fetch<SearchUser[]>("/api/admin/search-users", {
        query: { query },
      });
      if (request === latest) results.value = found;
    } catch {
      if (request === latest) results.value = [];
    }
  }, 300);
}

function pick(user: SearchUser) {
  emit("update:modelValue", user.username);
  close();
}

function close() {
  clearTimeout(timer);
  latest++;
  results.value = [];
}

onBeforeUnmount(() => clearTimeout(timer));
</script>
