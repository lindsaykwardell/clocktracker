<template>
  <div>
    <span class="block">Tags</span>
    <div class="flex gap-2 items-center">
      <div class="relative flex-1">
        <Combobox v-model="selectedTag" nullable>
          <ComboboxInput
            @change="query = $event.target.value"
            @keydown.enter.prevent="addCurrentTag"
            class="block w-full border bg-stone-300 dark:bg-stone-600 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
            placeholder="Type a tag name..."
            :displayValue="() => query"
          />
          <ComboboxOptions
            v-if="suggestions.length > 0"
            class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[150px] w-full overflow-y-auto z-10 rounded-b-md"
          >
            <ComboboxOption
              v-for="tag in suggestions"
              :key="tag"
              :value="tag"
              class="cursor-pointer p-2"
            >
              {{ tag }}
            </ComboboxOption>
          </ComboboxOptions>
        </Combobox>
      </div>
      <Button
        @click.prevent="addCurrentTag"
        size="sm"
        class="h-[2.5rem]"
        :disabled="!query.trim()"
      >
        Add
      </Button>
    </div>
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2 mt-2">
      <Button
        v-for="(tag, index) in modelValue"
        :key="tag"
        @click.prevent="removeTag(index)"
        size="sm"
        removableTag
        :title="`Remove ${tag}`"
      >
        {{ tag }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";

const props = defineProps<{
  modelValue: string[];
  availableTags: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [tags: string[]];
}>();

const query = ref("");

const suggestions = computed(() => {
  const q = query.value.toLowerCase().trim();
  if (!q) return [];
  return props.availableTags
    .filter(
      (tag) =>
        tag.toLowerCase().includes(q) && !props.modelValue.includes(tag)
    )
    .slice(0, 10);
});

const selectedTag = computed({
  get: () => null,
  set: (value: string | null) => {
    if (value) {
      addTag(value);
    }
  },
});

function addTag(tag: string) {
  const trimmed = tag.trim();
  if (trimmed && !props.modelValue.includes(trimmed)) {
    emit("update:modelValue", [...props.modelValue, trimmed]);
  }
  query.value = "";
}

function addCurrentTag() {
  addTag(query.value);
}

function removeTag(index: number) {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit("update:modelValue", updated);
}
</script>

<style scoped>
[data-headlessui-state="active"] {
  @apply bg-stone-300 dark:bg-stone-700;
}
</style>
