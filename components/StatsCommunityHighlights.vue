<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-sorts text-center text-xl lg:text-2xl">
      Highlights
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <!-- Most Good -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3 items-center text-center">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Most Good
        </h3>
        <template v-if="mostGood">
          <div class="relative">
            <Avatar
              :value="mostGood.player?.avatar || '/img/default.png'"
              size="lg-token"
              class="border-stone-800 relative"
              background
            />
            <div
              v-if="!mostGood.player?.user_id"
              class="absolute top-0 left-0 w-full h-full bg-neutral-200/75 dark:bg-stone-800/75 rounded-full z-10"
            />
          </div>
          <div class="text-center text-sm text-balance max-w-44">
            <span class="font-semibold">{{ mostGood.player.username }}</span> has finished 
            {{ mostGood.count }} game<span v-if="mostGood.count !== 1">s</span> as 
            <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span>.
          </div>
        </template>
        <template v-else>
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <div class="text-stone-400 text-sm">No eligible player.</div>
        </template>
      </div>

      <!-- Most Evil -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3 items-center text-center">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Most Evil
        </h3>
        <template v-if="mostEvil">
          <div class="relative">
            <Avatar
              :value="mostEvil.player?.avatar || '/img/default.png'"
              size="lg-token"
              class="border-stone-800 relative"
              background
            />
            <div
              v-if="!mostEvil.player?.user_id"
              class="absolute top-0 left-0 w-full h-full bg-neutral-200/75 dark:bg-stone-800/75 rounded-full z-10"
            />
          </div>
          <div class="text-center text-sm text-balance max-w-44">
            <span class="font-semibold">{{ mostEvil.player.username }}</span> has finished 
            {{ mostEvil.count }} game<span v-if="mostEvil.count !== 1">s</span> as 
            <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>.
          </div>
        </template>
        <template v-else>
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <div class="text-stone-400 text-sm">No eligible player.</div>
        </template>
      </div>

      <!-- Best win rate -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3 items-center text-center">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Highest Win Rate
        </h3>
        <template v-if="bestWinRate && bestWinRate.player">
          <div class="relative">
            <Avatar
              :value="bestWinRate.player?.avatar || '/img/default.png'"
              size="lg-token"
              class="border-stone-800 relative"
              background
            />
            <div
              v-if="!bestWinRate.player?.user_id"
              class="absolute top-0 left-0 w-full h-full bg-neutral-200/75 dark:bg-stone-800/75 rounded-full z-10"
            />
          </div>
          <div class="text-center text-sm text-balance max-w-44">
            <span class="font-semibold">{{ bestWinRate.player.username }}</span> has a 
            <span class="font-semibold">{{ bestWinRate.rate }}%</span> win rate, winning {{ bestWinRate.wins }} out of {{ bestWinRate.total }} games.
          </div>
        </template>
        <template v-else>
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <div class="text-stone-400 text-sm">No eligible player.</div>
        </template>
      </div>

      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Game Balance
        </h3>

        <StatsCommunityBalance 
          v-if="games?.length"
          :games="games"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";
import type { PlayerSummary } from "~/composables/useCommunityStats";

const props = defineProps<{
  players: PlayerSummary[];
  games?: GameRecord[];
}>();

const mostGood = computed(() => makeAlignmentCard("good"));
const mostEvil = computed(() => makeAlignmentCard("evil"));
const bestWinRate = computed(() => makeWinRateCard());

/**
 * Pick the top player by a numeric field, breaking ties by priority.
 */
function pickTop(field: keyof PlayerSummary) {
  if (!props.players?.length) return null;
  return (
    props.players
      .filter((p) => ((p[field] as number) ?? 0) > 0)
      .sort((a, b) => {
        const diff = (b[field] as number) - (a[field] as number);
        if (diff !== 0) return diff;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })[0] ?? null
  );
}

/**
 * Build the alignment highlight card.
 */
function makeAlignmentCard(field: "good" | "evil") {
  const p = pickTop(field === "good" ? "good_plays" : "evil_plays");
  if (!p) return null;
  const count = field === "good" ? p.good_plays : p.evil_plays;
  return {
    player: p,
    count
  };
}

/**
 * Build the win rate highlight card.
 */
function makeWinRateCard() {
  const p = pickBestWinRate();
  if (!p) return null;
  const rate = p.plays > 0 ? Math.round((p.wins / p.plays) * 100) : 0;
  return {
    player: p,
    rate,
    wins: p.wins,
    total: p.plays
  };
}

/**
 * Determine the player with the best win rate.
 */
function pickBestWinRate() {
  if (!props.players?.length) return null;
  return (
    props.players
      .filter((p) => p.plays > 0)
      .sort((a, b) => {
        const rateA = a.wins / a.plays;
        const rateB = b.wins / b.plays;
        if (rateB !== rateA) return rateB - rateA;
        // tie-breaker: more plays, then priority
        if (b.plays !== a.plays) return b.plays - a.plays;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })[0] ?? null
  );
}

</script>
