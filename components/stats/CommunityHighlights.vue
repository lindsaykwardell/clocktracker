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
          <IconUI
            v-if="bayesianTooltip"
            v-tooltip="{
            content: bayesianTooltip,
              html: true,
            }"
            id="info-circle" 
            size="sm" 
          />
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
          <div class="text-center text-sm text-balance max-w-48">
            <RedactedName
              class="font-semibold"
              :name="displayName(mostGood.player)"
              :redact="props.anonymizeNonUsers && !mostGood.player.user_id"
            />
            is <span class="font-semibold">{{ mostGood.rate }}% </span>
            <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span>,
            finishing
            <span v-if="mostGood.rate === 100">all games</span>
            <span v-else>{{ mostGood.count }} out of {{ mostGood.total }} games</span>
            on the Good team.
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
          <IconUI
            v-if="bayesianTooltip"
            v-tooltip="{
            content: bayesianTooltip,
              html: true,
            }"
            id="info-circle" 
            size="sm" 
          />
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
          <div class="text-center text-sm text-balance max-w-48">
            <RedactedName
              class="font-semibold"
              :name="displayName(mostEvil.player)"
              :redact="props.anonymizeNonUsers && !mostEvil.player.user_id"
            />
            is <span class="font-semibold">{{ mostEvil.rate }}% </span>
            <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>,
            finishing
            <span v-if="mostEvil.rate === 100">all games</span>
            <span v-else>{{ mostEvil.count }} out of {{ mostEvil.total }} games</span>
            on the Evil team.
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
          <IconUI
            v-if="bayesianTooltip"
            v-tooltip="{
            content: bayesianTooltip,
              html: true,
            }"
            id="info-circle" 
            size="sm" 
          />
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
            <RedactedName
              class="font-semibold"
              :name="displayName(bestWinRate.player)"
              :redact="props.anonymizeNonUsers && !bestWinRate.player.user_id"
            />
            has a 
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
import {
  COMMUNITY_STATS_BAYESIAN_ALPHA,
  COMMUNITY_STATS_BAYESIAN_BETA,
  COMMUNITY_STATS_MIN_GAMES,
  COMMUNITY_STATS_BAYESIAN_TOOLTIP,
  type PlayerSummary,
} from "~/composables/useCommunityStats";

const props = defineProps<{
  players: PlayerSummary[];
  games?: GameRecord[];
  anonymizeNonUsers?: boolean;
}>();

const mostGood = computed(() => makeAlignmentRateCard("good"));
const mostEvil = computed(() => makeAlignmentRateCard("evil"));
const bestWinRate = computed(() => makeWinRateCard());
const displayName = (player: PlayerSummary) =>
  player.display_name || player.username;

const useRelaxedStats = computed(
  () => (props.games?.length ?? 0) < COMMUNITY_STATS_MIN_GAMES
);
const minGames = computed(() =>
  useRelaxedStats.value ? 1 : COMMUNITY_STATS_MIN_GAMES
);
const bayesianTooltip = computed(() =>
  useRelaxedStats.value ? null : COMMUNITY_STATS_BAYESIAN_TOOLTIP
);

/**
 * Build the alignment rate highlight card.
 */
function makeAlignmentRateCard(field: "good" | "evil") {
  const p = pickBestAlignmentRate(field);
  if (!p) return null;
  const count = field === "good" ? p.good_plays : p.evil_plays;
  const rawRate = p.plays > 0 ? count / p.plays : 0;
  const rate = Math.round(rawRate * 100);
  return {
    player: p,
    count,
    rate,
    total: p.plays
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
      .filter((p) => p.plays >= minGames.value)
      .sort((a, b) => {
        const rateA = rateScore(a.wins, a.plays);
        const rateB = rateScore(b.wins, b.plays);
        if (rateB !== rateA) return rateB - rateA;
        // tie-breaker: more plays, then priority
        if (b.plays !== a.plays) return b.plays - a.plays;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })[0] ?? null
  );
}

/**
 * Determine the player with the highest good/evil rate.
 */
function pickBestAlignmentRate(field: "good" | "evil") {
  if (!props.players?.length) return null;
  const playsField = field === "good" ? "good_plays" : "evil_plays";
  return (
    props.players
      .filter((p) => p.plays >= minGames.value)
      .filter((p) => (p[playsField] ?? 0) > 0)
      .sort((a, b) => {
        const rateA = rateScore(a[playsField] ?? 0, a.plays);
        const rateB = rateScore(b[playsField] ?? 0, b.plays);
        if (rateB !== rateA) return rateB - rateA;
        if (b.plays !== a.plays) return b.plays - a.plays;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })[0] ?? null
  );
}

function bayesianRate(successes: number, total: number) {
  const alpha = COMMUNITY_STATS_BAYESIAN_ALPHA;
  const beta = COMMUNITY_STATS_BAYESIAN_BETA;
  return total > 0 ? (successes + alpha) / (total + alpha + beta) : 0;
}

function rateScore(successes: number, total: number) {
  if (!total) return 0;
  if (useRelaxedStats.value) return successes / total;
  return bayesianRate(successes, total);
}

</script>
