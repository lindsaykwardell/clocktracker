<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3">
    <h3 class="font-sorts text-center text-lg lg:text-xl">
      Top Scripts
    </h3>

    <div v-if="topScripts.length === 0" class="flex items-center justify-center flex-grow">
      <p class="text-center text-sm text-stone-400">
        No scripts played.
      </p>
    </div>

    <div v-else class="flex items-center">
      <ol
        class="list-decimal list-outside pl-4 text-sm md:text-base"
        :class="{
          'lg:columns-2': topScripts.length >= 5,
          'mx-auto': topScripts.length < 5,
        }"
      >
        <li
          v-for="(script, index) in topScripts"
          :key="script.name"
          class="text-balance"
          :class="{
            'sr-only md:not-sr-only py-1': index >= 3,
            'sr-only lg:not-sr-only py-1': index >= 5
          }"
        >
          <nuxt-link
            :to="getScriptLinkForName(script.name)"
            class="hover:underline"
          >
            {{ script.name }}
          </nuxt-link>
          <span class="text-xs md:text-base"> ({{ script.count }})</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GameRecord } from "~/composables/useGames";

const { Script } = useScripts();

const props = defineProps<{
  games: GameRecord[];
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

const topScripts = computed<ScriptSummary[]>(() => {
  const counts = new Map<string, number>();

  for (const game of props.games) {
    const scriptName = (game.script ?? "").trim();

    if (!scriptName || game.ignore_for_stats) continue;

    counts.set(scriptName, (counts.get(scriptName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});
</script>
