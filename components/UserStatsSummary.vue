<template>
  <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="stat">
      <div class="number text-blue-700">
        {{ overallStats.totalGames }}
      </div>
      <div class="label" :class="{ 'text-xl' : variant === 'profile' }">Games</div>
      <div class="text-stone-600">
        <template v-if="variant === 'profile'">
          <span class="text-sm">Since: {{ overallStats.firstGameDate ?? "Unknown" }}</span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1" :class="totalGamesTrend.textClass">
            <IconUI v-if="totalGamesTrend.iconId" :id="totalGamesTrend.iconId" size="sm" />
            <span class="text-sm">{{ totalGamesTrend.text }}</span>
          </span>
        </template>
      </div>
    </div>
    <div class="stat">
      <div class="number text-green-700">
        {{ overallStats.totalRoles }}
      </div>
      <div class="label" :class="{ 'text-xl' : variant === 'profile' }">Roles</div>
      <div class="text-stone-600">
        <template v-if="variant === 'profile'">
          <span class="text-sm">Top: {{ overallStats.favoriteRole ?? "None yet" }}</span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1" :class="totalRolesTrend.textClass">
            <IconUI v-if="totalRolesTrend.iconId" :id="totalRolesTrend.iconId" size="sm" />
            <span class="text-sm">{{ totalRolesTrend.text }}</span>
          </span>
        </template>
      </div>
    </div>
    <div class="stat"> 
      <div class="number text-purple-700">
        {{ overallStats.totalScripts }}
      </div>
      <div class="label" :class="{ 'text-xl' : variant === 'profile' }">Scripts</div>
      <div class="text-stone-600">
        <template v-if="variant === 'profile'">
          <span class="text-sm">Top: {{ overallStats.favoriteScript ?? "None yet" }}</span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1" :class="totalScriptsTrend.textClass">
            <IconUI v-if="totalScriptsTrend.iconId" :id="totalScriptsTrend.iconId" size="sm" />
            <span class="text-sm">{{ totalScriptsTrend.text }}</span>
          </span>
        </template>
      </div>
    </div>
    <div class="stat">
      <div class="number text-amber-700">
        {{ overallStats.winRate }}%
      </div>
      <div class="label" :class="{ 'text-xl' : variant === 'profile' }">Win Rate</div>
      <div class="text-stone-600">
        <template v-if="variant === 'profile'">
          <span class="text-sm">Wins: {{ overallStats.totalWins }}</span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1" :class="winRateTrend.textClass">
            <IconUI v-if="winRateTrend.iconId" :id="winRateTrend.iconId" size="sm" />
            <span class="text-sm">{{ winRateTrend.text }}</span>
          </span>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";

const props = defineProps<{
  games: GameRecord[];
  variant?: "profile" | "dashboard";
}>();

const variant = computed(() => props.variant ?? "profile");

type StatSummary = {
  totalGames: number;
  totalRoles: number;
  totalScripts: number;
  totalWins: number;
  totalDecided: number;
  winRate: number;
  favoriteRole: string | null;
  favoriteScript: string | null;
  firstGameDate: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getGameTime = (game: GameRecord) => {
  const time = new Date(game.date).getTime();
  return Number.isFinite(time) ? time : null;
};

const buildStats = (games: GameRecord[]): StatSummary => {
  const roleCounts = new Map<string, number>();
  const scriptCounts = new Map<string, number>();
  let wins = 0;
  let decided = 0;
  let earliest: number | null = null;

  for (const game of games) {
    if (game.script) {
      scriptCounts.set(game.script, (scriptCounts.get(game.script) ?? 0) + 1);
    }

    for (const character of game.player_characters) {
      if (!character.name) continue;
      roleCounts.set(character.name, (roleCounts.get(character.name) ?? 0) + 1);
    }

    const time = getGameTime(game);
    if (time !== null && (earliest === null || time < earliest)) {
      earliest = time;
    }

    if (game.is_storyteller) continue;

    const lastCharacter =
      game.player_characters[game.player_characters.length - 1];

    if (!lastCharacter) continue;

    if (
      game.win_v2 === WinStatus_V2.GOOD_WINS ||
      game.win_v2 === WinStatus_V2.EVIL_WINS
    ) {
      decided++;
    }

    switch (lastCharacter.alignment) {
      case "GOOD":
        if (game.win_v2 === WinStatus_V2.GOOD_WINS) wins++;
        break;
      case "EVIL":
        if (game.win_v2 === WinStatus_V2.EVIL_WINS) wins++;
        break;
    }
  }

  const pickTop = (map: Map<string, number>) => {
    let top: string | null = null;
    let topCount = 0;
    for (const [name, count] of map) {
      if (count > topCount) {
        top = name;
        topCount = count;
      }
    }
    return top;
  };

  const firstGameDate =
    earliest === null
      ? null
      : new Date(earliest).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });

  return {
    totalGames: games.length,
    totalRoles: roleCounts.size,
    totalScripts: scriptCounts.size,
    totalWins: wins,
    totalDecided: decided,
    winRate: decided === 0 ? 0 : Math.round((wins / decided) * 100),
    favoriteRole: pickTop(roleCounts),
    favoriteScript: pickTop(scriptCounts),
    firstGameDate,
  };
};

const overallStats = computed(() => buildStats(props.games));

const cutoffTime = computed(() => Date.now() - 30 * DAY_MS);

const statsAtCutoff = computed(() => {
  const cutoff = cutoffTime.value;
  const gamesBeforeCutoff = props.games.filter((game) => {
    const time = getGameTime(game);
    return time !== null && time <= cutoff;
  });

  return buildStats(gamesBeforeCutoff);
});

const trendLabel = (delta: number, suffix = "") => {
  if (delta > 0) {
    return {
      iconId: "graph-up",
      textClass: "text-green-500",
      text: `+${delta}${suffix}`,
    };
  }
  if (delta < 0) {
    return {
      iconId: "graph-down",
      textClass: "text-rose-600",
      text: `-${Math.abs(delta)}${suffix}`,
    };
  }
  return {
    iconId: null,
    textClass: "text-amber-600 font-bold",
    text: "-",
  };
};

const totalGamesTrend = computed(() =>
  trendLabel(overallStats.value.totalGames - statsAtCutoff.value.totalGames)
);

const totalRolesTrend = computed(() =>
  trendLabel(overallStats.value.totalRoles - statsAtCutoff.value.totalRoles)
);

const totalScriptsTrend = computed(() =>
  trendLabel(overallStats.value.totalScripts - statsAtCutoff.value.totalScripts)
);

const winRateTrend = computed(() =>
  trendLabel(
    statsAtCutoff.value.winRate === 0
      ? 0
      : Math.round(
          ((overallStats.value.winRate - statsAtCutoff.value.winRate) /
            statsAtCutoff.value.winRate) *
            100
        ),
    "%"
  )
);
</script>

<style scoped>
  .stat {
    @apply flex flex-col items-center p-1 text-center;
    @apply border rounded-lg dark:border-stone-700/50; 
    @apply bg-stone-200/30 dark:bg-stone-900/40;
    /* @apply border-l-4;  */
  }

  .label {
    @apply text-stone-700 dark:text-stone-400 font-sorts;
  }

  .number {
    @apply text-[1.375rem] font-semibold text-stone-600 dark:text-stone-300;
  }
</style>
