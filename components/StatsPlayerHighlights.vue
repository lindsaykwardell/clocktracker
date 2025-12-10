<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Highlights
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <!-- Most played -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
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
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            {{ props.isMe ? `You've` : `This player has` }} been {{ roleArticle(mostPlayed.role.name) }}<span class="font-semibold">{{ mostPlayed.role.name }}</span> 
            a total of {{ mostPlayed.plays }} game<span v-if="mostPlayed.plays !== 1">s</span>.
          </div>
        </div>

        <div v-else class="flex items-center justify-center flex-grow">
          <p class="text-center text-sm text-stone-400">
            Not enough data (No recorded games).
          </p>
        </div>
      </div>

      <!-- Best performing -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
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
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            {{ props.isMe ? `You` : `This player` }} finished {{ bestPerforming.plays }} game<span v-if="bestPerforming.plays !== 1">s</span> as
            {{ roleArticle(bestPerforming.role.name) }}<span class="font-semibold">{{ bestPerforming.role.name }}</span> and
            <span v-if="bestPerforming.losses > 0">won {{ bestPerforming.wins }} of those.</span>
            <span v-else>all of those were wins!</span>
          </div>
        </div>

        <div v-else class="flex items-center justify-center flex-grow">
          <p class="text-center text-sm text-stone-400 text-balance">
            Not enough data (No character with at least {{ MIN_PLAYS_FOR_PERFORMANCE }} plays and a win rate of 50% or higher).
          </p>
        </div>
        
      </div>

      <!-- Worst performing -->
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3">
        <h3 class="font-sorts text-center text-lg lg:text-xl">
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
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            {{ props.isMe ? `You` : `This player` }} finished {{ worstPerforming.plays }} game<span v-if="worstPerforming.plays !== 1">s</span> as
            {{ roleArticle(worstPerforming.role.name) }}<span class="font-semibold">{{ worstPerforming.role.name }}</span> and 
            <span v-if="worstPerforming.wins > 0">won only {{ worstPerforming.wins }} of those.</span>
            <span v-else>tragically all of those were losses...</span>
          </div>
        </div>

        <div v-else class="flex items-center justify-center flex-grow">
          <p class="text-center text-sm text-stone-400 text-balance">
            Not enough data (No character with at least {{ MIN_PLAYS_FOR_PERFORMANCE }} plays and a win rate lower than 50%).
          </p>
        </div>
      </div>

      <!-- Alignment -->
      <div class="lg:col-span-3 xl:col-span-1 p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Win Rate
        </h3>

        <StatsPlayerAlignmentWins 
          :games="games" 
          class="w-full mb-2" 
        />

        <div v-if="alignmentWinMessage" class="text-center text-sm text-balance max-w-64 mx-auto">
          <template v-if="alignmentWinMessage.alignment === 'GOOD'">
            {{ props.isMe ? 'You win' : 'This player wins' }} more games as
            <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span>.
          </template>
          <template v-else-if="alignmentWinMessage.alignment === 'EVIL'">
            {{ props.isMe ? 'You win' : 'This player wins' }} more games as
            <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>.
          </template>
          <template v-else>
            {{ props.isMe ? 'You win' : 'This player wins' }} games equally as
            <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> and
            <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>.
          </template>
        </div>

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
const MIN_WIN_RATE_FOR_BEST = 0.5;
const MAX_WIN_RATE_FOR_WORST = 0.49;

type Alignment = "GOOD" | "EVIL" | null;

type GrimoireToken = {
  alignment?: Alignment | null;
  role?: {
    type?: string | null;
    token_url?: string | null;
    initial_alignment?: Alignment;
  } | null;
  related_role?: {
    token_url?: string | null;
  } | null;
};

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  win_v2?: string | null; // "GOOD_WINS" | "EVIL_WINS" | etc.
  player_characters: (Character & {
    name: string | null;
    alignment?: Alignment;
    role_id?: string | null;
    role?: GrimoireToken["role"];
    related_role?: GrimoireToken["related_role"];
  })[];
};

const props = defineProps<{
  games: GameWithChars[];
  isMe?: boolean;
  username: string;
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

const alignmentWinMessage = computed<{
  alignment: "GOOD" | "EVIL" | null;
} | null>(() => {
  const stats = alignmentStats.value;
  if (!stats) return null;

  const goodDecided = stats.good.wins + stats.good.losses;
  const evilDecided = stats.evil.wins + stats.evil.losses;

  if (!goodDecided && !evilDecided) return null;

  const goodRate = goodDecided ? stats.good.wins / goodDecided : 0;
  const evilRate = evilDecided ? stats.evil.wins / evilDecided : 0;

  if (goodDecided && evilDecided) {
    if (goodRate > evilRate) return { alignment: "GOOD" };
    if (evilRate > goodRate) return { alignment: "EVIL" };
    return { alignment: null };
  }

  return { alignment: goodDecided ? "GOOD" : "EVIL" };
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

    const total = stats.wins + stats.losses;
    const winRate = total > 0 ? stats.wins / total : 0;

    if (total === 0) continue;
    if (winRate < MIN_WIN_RATE_FOR_BEST) continue;

    const bestWins = best?.wins ?? 0;
    const bestLosses = best?.losses ?? 0;
    const bestTotal = bestWins + bestLosses;
    const bestRate = bestTotal > 0 ? bestWins / bestTotal : 0;

    if (
      !best ||
      winRate > bestRate ||
      (winRate === bestRate && stats.wins > bestWins) ||
      (winRate === bestRate &&
        stats.wins === bestWins &&
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

    const total = stats.wins + stats.losses;
    const winRate = total > 0 ? stats.wins / total : 0;

    if (total === 0) continue;
    if (winRate > MAX_WIN_RATE_FOR_WORST) continue;
    if (stats.losses === 0) continue;

    const worstWins = worst?.wins ?? 0;
    const worstLosses = worst?.losses ?? 0;
    const worstTotal = worstWins + worstLosses;
    const worstRate = worstTotal > 0 ? worstWins / worstTotal : 0;

    if (
      !worst ||
      winRate < worstRate ||
      (winRate === worstRate && stats.losses > worstLosses) ||
      (winRate === worstRate &&
        stats.losses === worstLosses &&
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
