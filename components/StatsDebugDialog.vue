<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <p v-if="summary" class="text-sm text-stone-400 pt-2">{{ summary }}</p>
      <p v-if="warning" class="text-sm text-amber-400 pt-1">{{ warning }}</p>
    </template>

    <div class="px-4 pb-4 text-sm">
      <label class="flex items-center gap-2 pb-3 text-stone-300">
        <input type="checkbox" v-model="showExcluded" />
        Show games that don't count ({{ excludedCount }})
      </label>

      <p v-if="!visibleRows.length" class="text-stone-400">No games.</p>

      <ul class="flex flex-col gap-1">
        <li
          v-for="row in visibleRows"
          :key="row.id"
          class="rounded px-3 py-2"
          :class="row.counts ? 'bg-stone-800' : 'bg-stone-800/40 text-stone-400'"
        >
          <div class="flex flex-wrap items-baseline gap-x-3">
            <span class="font-semibold tabular-nums w-16 shrink-0">{{ row.value }}</span>
            <a
              :href="`/game/${row.id}`"
              target="_blank"
              class="underline underline-offset-2 hover:text-white"
            >
              {{ row.date }} · {{ row.script || "No script" }}
            </a>
            <span v-if="row.reason" class="text-stone-400">{{ row.reason }}</span>
          </div>
          <p
            v-if="row.details?.length"
            class="pt-1 text-xs text-stone-500 break-words"
          >
            {{ row.details.join(" · ") }}
          </p>
        </li>
      </ul>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
export type StatsDebugDialogRow = {
  id: string;
  date: string;
  script: string | null;
  /** What the game adds, shown in the first column. */
  value: string;
  counts: boolean;
  reason?: string | null;
  details?: string[];
};

const props = defineProps<{
  visible: boolean;
  title: string;
  summary?: string;
  warning?: string | null;
  rows: StatsDebugDialogRow[];
}>();

const emit = defineEmits(["update:visible"]);

const showExcluded = ref(false);

const excludedCount = computed(() => props.rows.filter((row) => !row.counts).length);

const visibleRows = computed(() =>
  showExcluded.value ? props.rows : props.rows.filter((row) => row.counts)
);
</script>
