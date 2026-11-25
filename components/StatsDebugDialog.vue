<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold">{{ title }}</h2>
      <p v-if="summary" class="text-sm text-stone-400 pt-2">{{ summary }}</p>
      <p v-if="warning" class="text-sm text-amber-400 pt-1">{{ warning }}</p>
    </template>

    <!-- A fixed height, so showing the games that don't count doesn't
         resize and move the dialog; only the list scrolls. -->
    <div class="flex flex-col h-[min(70vh,calc(100vh-12rem))] px-4 pb-4 text-sm">
      <label class="flex shrink-0 items-center gap-2 pb-3 text-stone-300">
        <input type="checkbox" v-model="showExcluded" />
        Show games that don't count ({{ gameCount(excludedCount) }})
      </label>

      <!-- relative: the links' sr-only text is absolutely placed, and has to
           stay inside this scroller instead of stretching the dialog. -->
      <div class="debug-list relative min-h-0 flex-1 overflow-y-auto border-t border-stone-700 pt-3">
      <p v-if="!visibleRows.length" class="text-stone-400">
        <template v-if="!rows.length">No games.</template>
        <template v-else-if="!showExcluded">
          No games count toward this. Show the games that don't count to see why.
        </template>
        <template v-else>No games.</template>
      </p>

      <!--
        One grid for the whole list: the first column is as wide as the widest
        value in this list, and every block and row lines up on it (subgrid).
        Rows that share a group (such as one streak) sit together; gaps only
        between groups.
      -->
      <div class="grid grid-cols-[auto_1fr] gap-y-1">
        <ul
          v-for="group in groupedRows"
          :key="group.key"
          class="col-span-2 grid grid-cols-subgrid rounded overflow-hidden"
        >
          <li
            v-for="row in group.rows"
            :key="row.id"
            class="col-span-2 grid grid-cols-subgrid gap-x-3 items-center px-3 py-2"
            :class="[
              row.counts ? 'bg-stone-800' : 'bg-stone-800/40 text-stone-400',
              row.accent ? 'border-l-4' : '',
              row.minor ? 'text-xs py-1' : '',
            ]"
            :style="row.accent ? { borderLeftColor: row.accent } : undefined"
          >
            <span class="flex items-center gap-2 font-semibold tabular-nums">
              <WinIcon
                v-if="row.result"
                :result="row.result"
                class="shrink-0"
                :class="row.minor ? 'w-4 h-4' : 'w-5 h-5'"
              />
              <img
                v-else-if="row.icon"
                :src="row.icon"
                :alt="row.iconAlt ?? ''"
                class="shrink-0"
                :class="row.minor ? 'w-4 h-4' : 'w-6 h-6'"
              />
              {{ row.value }}
            </span>
            <div class="flex flex-wrap items-center gap-x-3">
              <span class="tabular-nums text-stone-400">{{ row.date }}</span>
              <span :class="row.counts ? 'text-stone-100' : 'text-stone-300'">
                {{ row.script || "No script" }}
              </span>
              <span v-if="row.reason" class="text-stone-400">{{ row.reason }}</span>
              <span class="ml-auto flex gap-3">
                <a :href="`/game/${row.id}`" target="_blank" class="game-link">
                  View<span class="sr-only"> {{ row.date }} {{ row.script || "No script" }} (opens in a new tab)</span>
                </a>
                <a :href="`/game/${row.id}/edit`" target="_blank" class="game-link">
                  Edit<span class="sr-only"> {{ row.date }} {{ row.script || "No script" }} (opens in a new tab)</span>
                </a>
              </span>
            </div>
            <ul
              v-if="row.details?.length"
              class="col-span-2 pt-1 text-xs text-stone-400 break-words"
            >
              <li v-for="(detail, index) in row.details" :key="index">{{ detail }}</li>
            </ul>
          </li>
        </ul>
      </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { GameResult } from "~/composables/useGames";

export type StatsDebugDialogRow = {
  id: string;
  date: string;
  script: string | null;
  /** What the game adds, shown in the first column. */
  value: string;
  counts: boolean;
  reason?: string | null;
  details?: string[];
  /** Small image before the value, such as a team thumb. */
  icon?: string;
  /** The game's trophy (WinIcon), before the value. */
  result?: GameResult;
  iconAlt?: string;
  /** A CSS colour for a left border that marks the row. */
  accent?: string;
  /** Counts, but isn't what the stat reports: shown smaller. */
  minor?: boolean;
  /** Consecutive rows with the same group are shown as one block. */
  group?: string;
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

const gameCount = (count: number) => `${count} game${count === 1 ? "" : "s"}`;

const visibleRows = computed(() =>
  showExcluded.value ? props.rows : props.rows.filter((row) => row.counts)
);

// Rows without a group each get their own block, as before.
const groupedRows = computed(() => {
  const groups: { key: string; rows: StatsDebugDialogRow[] }[] = [];
  for (const row of visibleRows.value) {
    const last = groups.at(-1);
    if (row.group !== undefined && last && last.key === `group-${row.group}`) {
      last.rows.push(row);
    } else {
      groups.push({ key: row.group !== undefined ? `group-${row.group}` : `row-${row.id}`, rows: [row] });
    }
  }
  return groups;
});
</script>

<style scoped>
.debug-list {
  scrollbar-width: thin;
  scrollbar-color: theme(colors.stone.600) transparent;
  scrollbar-gutter: stable;
}

.game-link {
  @apply text-stone-300 underline underline-offset-2 hover:text-white;
}
</style>
