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
              class="col-span-2 pt-1 text-xs text-stone-500 break-words"
            >
              {{ row.details.join(" · ") }}
            </p>
          </li>
        </ul>
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
