<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold">Grimoire check</h2>
      <p class="text-sm text-stone-400 pt-2">
        {{ flaggedGames.length }} of {{ games.length }} game{{ games.length === 1 ? "" : "s" }}
        look odd.
      </p>
    </template>

    <div class="px-4 pb-4 text-sm">
      <div class="flex flex-col gap-1 pb-3 text-stone-300">
        <label
          v-for="rule in rules"
          :key="rule.id"
          class="flex items-baseline gap-2"
          :title="rule.description"
        >
          <input type="checkbox" v-model="enabledRules" :value="rule.id" />
          <span>
            {{ rule.label }} ({{ countByRule[rule.id] ?? 0 }})
            <span class="text-xs text-stone-500">{{ rule.description }}</span>
          </span>
        </label>
      </div>

      <p v-if="!visibleGames.length" class="text-stone-400">Nothing found.</p>

      <ul class="flex flex-col gap-1">
        <li v-for="row in visibleGames" :key="row.id" class="rounded px-3 py-2 bg-stone-800">
          <a
            :href="`/game/${row.id}`"
            target="_blank"
            class="underline underline-offset-2 hover:text-white"
          >
            {{ row.date }} · {{ row.script || "No script" }}
          </a>
          <ul class="pt-1 text-xs text-stone-400 flex flex-col gap-0.5">
            <li v-for="(finding, index) in row.findings" :key="index" class="break-words">
              <span class="text-stone-500">{{ ruleLabel[finding.rule] }}:</span>
              {{ finding.message }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import {
  GRIMOIRE_CHECK_RULES,
  checkGrimoire,
  type GrimoireCheckFinding,
  type GrimoireCheckGame,
} from "~/utils/grimoireChecks";

const props = defineProps<{
  visible: boolean;
  games: (GrimoireCheckGame & { id: string; date: string | Date; script: string | null })[];
}>();

const emit = defineEmits(["update:visible"]);

const rules = GRIMOIRE_CHECK_RULES;
const ruleLabel = Object.fromEntries(rules.map((rule) => [rule.id, rule.label]));
const enabledRules = ref<string[]>(rules.map((rule) => rule.id));

// Only checked while the dialog is open.
const flaggedGames = computed(() => {
  if (!props.visible) return [];
  return [...props.games]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((game) => ({
      id: game.id,
      date: new Date(game.date).toLocaleDateString(),
      script: game.script,
      findings: checkGrimoire(game) as GrimoireCheckFinding[],
    }))
    .filter((row) => row.findings.length);
});

const countByRule = computed(() => {
  const counts: Record<string, number> = {};
  for (const row of flaggedGames.value) {
    for (const rule of new Set(row.findings.map((finding) => finding.rule))) {
      counts[rule] = (counts[rule] ?? 0) + 1;
    }
  }
  return counts;
});

const visibleGames = computed(() =>
  flaggedGames.value
    .map((row) => ({
      ...row,
      findings: row.findings.filter((finding) => enabledRules.value.includes(finding.rule)),
    }))
    .filter((row) => row.findings.length)
);
</script>
