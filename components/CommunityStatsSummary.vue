<template>
  <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="stat">
      <div class="number text-blue-700">
        {{ totalGames }}
      </div>
      <div class="label">Games</div>
      <div class="text-stone-600">
        <span class="text-sm">Since: {{ firstGameDate ?? "Unknown" }}</span>
      </div>
    </div>
    <div class="stat">
      <div class="number text-green-700">
        {{ memberCount }}
      </div>
      <div class="label">Community Members</div>
      <div class="text-stone-600">
        <span class="text-sm">Total players: {{ activePlayersCount }}</span>
      </div>
    </div>
    <div class="stat">
      <div class="number text-purple-700">
        {{ totalScripts }}
      </div>
      <div class="label">Scripts</div>
      <div class="text-stone-600">
        <span class="text-sm">Top: {{ favoriteScript ?? "None yet" }}</span>
      </div>
    </div>
    <div class="stat">
      <div class="number text-amber-700">
        {{ goodRate }}%
      </div>
      <div class="label">Good Win Rate</div>
      <div class="text-stone-600">
        <span class="text-sm">Wins Good/Evil: {{ goodWins }}/{{ evilWins }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";

const props = defineProps<{
  games: GameRecord[];
  memberCount: number;
  activePlayersCount: number;
}>();

const getGameTime = (game: GameRecord) => {
  const time = new Date(game.date).getTime();
  return Number.isFinite(time) ? time : null;
};

const totalGames = computed(() => props.games.length);

const totalScripts = computed(() => {
  const scripts = new Set<string>();
  for (const game of props.games) {
    if (game.script) scripts.add(game.script);
  }
  return scripts.size;
});

const favoriteScript = computed(() => {
  const counts = new Map<string, number>();
  for (const game of props.games) {
    if (!game.script) continue;
    counts.set(game.script, (counts.get(game.script) ?? 0) + 1);
  }

  let top: string | null = null;
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      top = name;
      topCount = count;
    }
  }

  return top;
});

const firstGameDate = computed(() => {
  let earliest: number | null = null;
  for (const game of props.games) {
    const time = getGameTime(game);
    if (time === null) continue;
    if (earliest === null || time < earliest) earliest = time;
  }

  if (earliest === null) return null;

  return new Date(earliest).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
});

const winsByAlignment = computed(() => {
  let good = 0;
  let evil = 0;
  for (const game of props.games) {
    if (game.win_v2 === WinStatus_V2.GOOD_WINS) good++;
    if (game.win_v2 === WinStatus_V2.EVIL_WINS) evil++;
  }
  return { good, evil };
});

const goodWins = computed(() => winsByAlignment.value.good);
const evilWins = computed(() => winsByAlignment.value.evil);

const goodRate = computed(() => {
  const decided = goodWins.value + evilWins.value;
  if (decided === 0) return 0;
  return Math.round((goodWins.value / decided) * 100);
});
</script>

<style scoped>
  .stat {
    @apply flex flex-col items-center p-1 text-center;
    @apply border rounded-lg dark:border-stone-700/50; 
    @apply bg-stone-200/30 dark:bg-stone-900/40;
  }

  .label {
    @apply text-stone-700 dark:text-stone-400 font-sorts;
  }

  .number {
    @apply text-[1.375rem] font-semibold text-stone-600 dark:text-stone-300;
  }
</style>
