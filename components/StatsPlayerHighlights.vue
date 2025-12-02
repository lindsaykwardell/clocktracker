<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Highlights
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <!-- Most played -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Most Played
        </h3>

        <div v-if="mostPlayed" class="flex flex-col items-center gap-2">
          <nuxt-link
            :to="roleLink(mostPlayed.role.name)"
           >
            <Token
              :character="{
                name: mostPlayed.role.name,
                role: {
                  name: mostPlayed.role.name,
                  token_url: mostPlayed.role.token_url,
                },
              }"
              size="lg"
              v-tooltip="`${mostPlayed.role.name} (${mostPlayed.plays} games)`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            Has been {{ roleArticle(mostPlayed.role.name) }}<span class="font-semibold">{{ mostPlayed.role.name }}</span> 
            a total of {{ mostPlayed.plays }} game<span v-if="mostPlayed.plays !== 1">s</span>.
          </div>
        </div>

        <p v-else class="text-center text-sm text-stone-400">
          Not enough data.
        </p>
      </div>

      <!-- Best performing -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Best Performing
        </h3>

        <div v-if="bestPerforming" class="flex flex-col items-center gap-2">
          <nuxt-link 
            :to="roleLink(bestPerforming.role.name)"
          >
            <Token
              :character="{
                name: bestPerforming.role.name,
                role: {
                  name: bestPerforming.role.name,
                  token_url: bestPerforming.role.token_url,
                },
              }"
              size="lg"
              v-tooltip="`${bestPerforming.role.name} (${bestPerforming.wins} wins)`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            Was {{ roleArticle(bestPerforming.role.name) }}<span class="font-semibold">{{ bestPerforming.role.name }}</span> 
            in {{ bestPerforming.plays }} game<span v-if="bestPerforming.plays !== 1">s</span> and 
            <span v-if="bestPerforming.losses > 0">won {{ bestPerforming.wins }} of those!</span>
            <span v-else>didn't lose a single one!</span>
          </div>
        </div>

        <p v-else class="text-center text-sm text-stone-400">
          Not enough data (No character with at least {{ MIN_PLAYS_FOR_PERFORMANCE }} plays).
        </p>
      </div>

      <!-- Worst performing -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Worst Performing
        </h3>

        <div v-if="worstPerforming" class="flex flex-col items-center gap-2">
          <nuxt-link 
          :to="roleLink(worstPerforming.role.name)"
          >
            <Token
              :character="{
                name: worstPerforming.role.name,
                role: {
                  name: worstPerforming.role.name,
                  token_url: worstPerforming.role.token_url,
                },
              }"
              size="lg"
              v-tooltip="`${worstPerforming.role.name} (${worstPerforming.losses} losses)`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-40">
            Was {{ roleArticle(worstPerforming.role.name) }}<span class="font-semibold">{{ worstPerforming.role.name }}</span> 
            in {{ worstPerforming.plays }} game<span v-if="worstPerforming.plays !== 1">s</span> and 
            <span v-if="worstPerforming.wins > 0">won only {{ worstPerforming.wins }} of those.</span>
            <span v-else>tragically lost all of those...</span>
          </div>
        </div>

        <p v-else class="text-center text-sm text-stone-400">
          Not enough data (No character with at least {{ MIN_PLAYS_FOR_PERFORMANCE }} plays).
        </p>
      </div>

      <!-- Win rate -->
      <div class="lg:col-span-3 xl:col-span-1 p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Win Rate
        </h3>

        <StatsPlayerWinRateOverTime 
          :games="games" 
          class="w-full mb-2" 
        />

        <div v-if="alignmentStats">
          <div class="flex flex-col text-center text-sm md:text-base">
            <div class="text-center text-sm text-balance max-w-64 mx-auto">
              <span v-if="strongestAlignment === 'GOOD'">
                You win more often as
                <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span>.
              </span>
              <span v-else-if="strongestAlignment === 'EVIL'">
                You win more often as
                <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>.
              </span>
              <span v-else>
                You're <span class="font-semibold">equally deadly</span> on both sides.
              </span>
            </div>

            <div class="flex w-full justify-between gap-4 mt-2 text-xs md:text-sm">
              <div class="flex-1 text-left">
                <div class="font-semibold text-sm" :style="`color: ${chartColors.good}`">Good</div>
                <!-- <div>
                  Games: {{ goodStats.plays }}
                </div> -->
                <div>
                  W/L: {{ goodStats.wins }}/{{ goodStats.losses }} ({{ formatPercent(goodStats.wins, goodStats.plays) }})
                </div>
              </div>

              <div class="flex-1 text-right">
                <div class="font-semibold text-sm" :style="`color: ${chartColors.evil}`">Evil</div>
                <!-- <div>
                  Games: {{ evilStats.plays }}
                </div> -->
                <div>
                   W/L: {{ evilStats.wins }}/{{ evilStats.losses }} ({{ formatPercent(evilStats.wins, evilStats.plays) }})
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="text-center text-sm text-stone-400">
          Not enough data.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Game, Character } from "@prisma/client";
import { chartColors } from "~/composables/useChartColors";

// Minimum number of games required for a character to be considered in best/worst performance.
const MIN_PLAYS_FOR_PERFORMANCE = 3;

type Alignment = "GOOD" | "EVIL" | null;

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  win_v2?: string | null; // "GOOD_WINS" | "EVIL_WINS" | etc.
  player_characters: (Character & {
    name: string | null;
    alignment?: Alignment;
    role_id?: string | null;
    role?: {
      type?: string | null;
      token_url?: string | null;
      initial_alignment?: Alignment;
    } | null;
    related_role?: {
      token_url?: string | null;
    } | null;
  })[];
};

const props = defineProps<{
  games: GameWithChars[];
}>();

type RoleSummary = {
  role: {
    name: string;
    token_url: string | null;
    initial_alignment?: Alignment;
  };
  plays: number;
  wins: number;
  losses: number;
};

type SideSummary = {
  side: "GOOD" | "EVIL";
  plays: number;
  wins: number;
  losses: number;
};

/**
 * Build stats map for roles.
 * 
 * Currently only considers the character the player ended the game as.
 * 
 * @todo Maybe this should include all characters during a game?
 */
const roleStatsMap = computed<Map<string, RoleSummary>>(() => {
  const map = new Map<string, RoleSummary>();

  for (const game of props.games) {
    const last = getStatsCharacter(game);
    if (!last) continue;

    const alignment = last.alignment as Alignment;
    if (!alignment) continue;

    const displayName = last.name;
    const key = displayName;

    const tokenUrl =
      last.role?.token_url ?? last.related_role?.token_url ?? null;

    const result = game.win_v2;

    let stats = map.get(key);
    if (!stats) {
      stats = {
        role: {
          name: displayName,
          token_url: tokenUrl,
          initial_alignment: alignment,
        },
        plays: 0,
        wins: 0,
        losses: 0,
      };
      map.set(key, stats);
    }

    stats.plays++;

    const goodWins = result === "GOOD_WINS";
    const evilWins = result === "EVIL_WINS";

    if (
      (alignment === "GOOD" && goodWins) ||
      (alignment === "EVIL" && evilWins)
    ) {
      stats.wins++;
    } 
    else if (
      (alignment === "GOOD" && evilWins) ||
      (alignment === "EVIL" && goodWins)
    ) {
      stats.losses++;
    }
  }

  return map;
});

/**
 * Determine stats for each alignment.
 */
const alignmentStats = computed(() => {
  const good: SideSummary = { side: "GOOD", plays: 0, wins: 0, losses: 0 };
  const evil: SideSummary = { side: "EVIL", plays: 0, wins: 0, losses: 0 };

  for (const game of props.games) {
    const last = getStatsCharacter(game);
    if (!last) continue;

    const alignment = last.alignment as Alignment;
    if (!alignment) continue;

    const result = game.win_v2;
    const goodWins = result === "GOOD_WINS";
    const evilWins = result === "EVIL_WINS";

    if (alignment === "GOOD") {
      good.plays++;
      if (goodWins) good.wins++;
      else if (evilWins) good.losses++;
    } 
    else if (alignment === "EVIL") {
      evil.plays++;
      if (evilWins) evil.wins++;
      else if (goodWins) evil.losses++;
    }
  }

  if (!good.plays && !evil.plays) {
    return null;
  }

  return { good, evil };
});

const goodStats = computed(() =>
  alignmentStats.value ? alignmentStats.value.good : { side: "GOOD", plays: 0, wins: 0, losses: 0 }
);

const evilStats = computed(() =>
  alignmentStats.value ? alignmentStats.value.evil : { side: "EVIL", plays: 0, wins: 0, losses: 0 }
);

/**
 * Determine the alignment a player is best at.
 */
const strongestAlignment = computed<"GOOD" | "EVIL" | "BALANCED">(() => {
  if (!alignmentStats.value) return "BALANCED";

  const good = goodStats.value;
  const evil = evilStats.value;

  const goodRate = good.plays ? good.wins / good.plays : 0;
  const evilRate = evil.plays ? evil.wins / evil.plays : 0;

  if (goodRate === evilRate) return "BALANCED";
  return goodRate > evilRate ? "GOOD" : "EVIL";
});

/**
 * Determine "Most Played" character.
 */
const mostPlayed = computed<RoleSummary | null>(() => {
  let best: RoleSummary | null = null;

  for (const stats of roleStatsMap.value.values()) {
    if (!best || stats.plays > best.plays) {
      best = stats;
    }
  }

  return best;
});

/**
 * Determine "Best Performing" character.
 * 
 * Characters need at least MIN_PLAYS_FOR_PERFORMANCE 
 * plays to be considered.
 */
const bestPerforming = computed<RoleSummary | null>(() => {
  let best: RoleSummary | null = null;

  for (const stats of roleStatsMap.value.values()) {
    if (stats.plays < MIN_PLAYS_FOR_PERFORMANCE) continue;
    if (stats.wins === 0) continue;

    const total = stats.wins + stats.losses;
    const winRate = total > 0 ? stats.wins / total : 0;

    if (!best) {
      best = stats;
      continue;
    }

    const bestTotal = best.wins + best.losses;
    const bestRate = bestTotal > 0 ? best.wins / bestTotal : 0;

    if (
      stats.wins > best.wins ||
      (stats.wins === best.wins && winRate > bestRate) ||
      (stats.wins === best.wins &&
        winRate === bestRate &&
        stats.plays > best.plays)
    ) {
      best = stats;
    }
  }

  return best;
});

/**
 * Determine "Worst Performing" character.
 * 
 * Characters need at least MIN_PLAYS_FOR_PERFORMANCE 
 * plays to be considered.
 */
const worstPerforming = computed<RoleSummary | null>(() => {
  let worst: RoleSummary | null = null;

  for (const stats of roleStatsMap.value.values()) {
    if (stats.plays < MIN_PLAYS_FOR_PERFORMANCE) continue;
    if (stats.losses === 0) continue;

    const total = stats.wins + stats.losses;
    const winRate = total > 0 ? stats.wins / total : 0;

    if (!worst) {
      worst = stats;
      continue;
    }

    const worstTotal = worst.wins + worst.losses;
    const worstRate = worstTotal > 0 ? worst.wins / worstTotal : 0;

    if (
      stats.losses > worst.losses ||
      (stats.losses === worst.losses && winRate < worstRate) ||
      (stats.losses === worst.losses &&
        winRate === worstRate &&
        stats.plays > worst.plays)
    ) {
      worst = stats;
    }
  }

  return worst;
});

/**
 * Determine the character used for stats in a game.
 *
 * Currently this uses the last character in `player_characters`,
 * which represents the role a player ended the game as.
 *
 * Games flagged with `ignore_for_stats`, games without characters,
 * nameless characters, and Fabled roles are ignored.
 */
function getStatsCharacter(game: GameWithChars) {
  if (game.ignore_for_stats) return null;
  if (!game.player_characters.length) return null;

  const last = game.player_characters.at(-1);
  if (!last || !last.name) return null;
  if (last.role?.type === "FABLED" || last.role?.type === "LORIC") return null;

  return last;
}

/**
 * Return a link to a characters detail page.
 */
function roleLink(name?: string) {
  if (!name) return "#";
  return `/roles/${name.toLowerCase().replace(/ /g, "_")}`;
}

/**
 * Return percentage value.
 */
function formatPercent(wins: number, plays: number): string {
  if (!plays) return "0%";
  return `${Math.round((wins / plays) * 100)}%`;
}

/**
 * Return "the " for most roles, but omit it for plural/group-style names
 * or names that already start with "The ".
 */
function roleArticle(name: string): "" | "the " {
  const pluralRoles = [
    "Legion", 
    "Lil' Monsta", 
    "Riot", 
  ];
  if (pluralRoles.includes(name)) return "";
  if (name.startsWith("The ")) return "";
  return "the ";
}
</script>
