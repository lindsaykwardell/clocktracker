<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3">
    <h3 class="font-sorts text-center text-lg lg:text-xl">
      Top Scripts
    </h3>

    <div v-if="topScripts.length === 0" class="flex items-center justify-center flex-grow">
      <p class="text-center text-sm text-stone-400">
        No scripts storytold.
      </p>
    </div>

    <div v-else class="flex items-center overflow-hidden">
      <ol
        class="relative -top-px list-none w-full text-sm md:text-base divide-y divide-stone-300 dark:divide-stone-700/40"
        :class="{
          'lg:columns-2': topScripts.length >= 5,
          'mx-auto max-w-[15rem]': topScripts.length < 5,
        }"
      >
        <li
          v-for="(script, index) in topScripts"
          :key="script.name"
          class="text-balance flex items-center justify-between gap-3 py-1 break-inside-avoid"
          :class="{
            'hidden md:flex py-1': index >= 3,
            'hidden lg:flex py-1': index >= 5
          }"
        >
          <div class="flex items-center gap-2">
            <div
              class="rounded-full w-3 md:w-4 h-3 md:h-4 aspect-square border"
              :style="{ backgroundColor: colorForScript(script.name) }"
            />
            <nuxt-link
              :to="getScriptLinkForName(script.name)"
              class="hover:underline"
            >
              {{ script.name }}
            </nuxt-link>
          </div>

          <span class="text-xs md:text-sm text-stone-800 px-1 bg-stone-300 rounded-md leading-none">
            {{ script.count }}
          </span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GameRecord } from "~/composables/useGames";
import { filterStorytellerGames } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
  username: string;
}>();

type ScriptSummary = {
  name: string;
  count: number;
};

/**
 * Return link to script detail page for script name.
 */
function getScriptLinkForName(name: string) {
  if (name === Script.TroubleBrewing) return "/scripts/Trouble_Brewing";
  if (name === Script.BadMoonRising) return "/scripts/Bad_Moon_Rising";
  if (name === Script.SectsAndViolets) return "/scripts/Sects_and_Violets";

  // Custom scripts.
  return `/scripts/${name.replaceAll(" ", "_")}`;
}

/**
 * Storyteller games for this user.
 */
const storytellerGames = computed(() =>
  filterStorytellerGames(props.games, props.username)
);

/**
 * Top scripts storytold by this user (by play count, up to 10).
 */

const topScripts = computed<ScriptSummary[]>(() => {
  const counts = new Map<string, number>();

  for (const game of storytellerGames.value) {
    const scriptName = (game.script ?? "").trim();

    if (!scriptName) continue;

    counts.set(scriptName, (counts.get(scriptName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

function colorForScript(name: string) {
  if (name === Script.TroubleBrewing) return chartColors.tb;
  if (name === Script.SectsAndViolets) return chartColors.snv;
  if (name === Script.BadMoonRising) return chartColors.bmr;
  if (!name) return chartColors.unknown;
  return chartColors.custom;
}
</script>
