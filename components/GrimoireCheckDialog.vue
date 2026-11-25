<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold">Games check</h2>
      <p class="text-sm text-stone-400 pt-2">{{ gameCount(games.length) }} checked.</p>
    </template>

    <!-- A fixed height, so ticking a check doesn't resize and move the dialog;
         only the list scrolls, so the checks stay in view. -->
    <div class="flex flex-col h-[min(70vh,calc(100vh-12rem))] px-4 pb-4 text-sm">
      <div class="grid gap-x-8 gap-y-3 pb-3 md:grid-cols-2 shrink-0">
        <fieldset v-for="group in ruleGroups" :key="group.title" class="min-w-0">
          <legend class="flex w-full items-baseline gap-3 pb-1">
            <span class="font-medium text-stone-200">{{ group.title }}</span>
            <span class="flex gap-2 text-xs text-stone-400">
              <button type="button" class="check-toggle" @click="setGroup(group.rules, true)">
                All<span class="sr-only"> {{ group.title.toLowerCase() }}</span>
              </button>
              <button type="button" class="check-toggle" @click="setGroup(group.rules, false)">
                None<span class="sr-only"> {{ group.title.toLowerCase() }}</span>
              </button>
            </span>
          </legend>
          <div
            v-for="rule in group.rules"
            :key="rule.id"
            class="flex items-center gap-2 py-0.5"
            :class="countByRule[rule.id] ? 'text-stone-200' : 'text-stone-400'"
          >
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="enabledRules" :value="rule.id" />
              {{ rule.label }}
            </label>
            <InfoHint :label="`About ${rule.label}`" container="dialog[open] [data-dialog-content]">{{ rule.description }}</InfoHint>
            <span class="ml-auto text-xs text-stone-400 tabular-nums">
              {{ ruleCountText(rule.id) }}
            </span>
          </div>
        </fieldset>
      </div>

      <p class="sr-only" aria-live="polite">{{ statusText }}</p>

      <div class="check-list min-h-0 flex-1 overflow-y-auto border-t border-stone-700 pt-3">
        <p v-if="!enabledRules.length" class="text-stone-400">
          No checks selected. Tick a check above to list games.
        </p>
        <p v-else-if="!visibleSections.length" class="text-stone-400">
          No games match the selected checks.
        </p>

        <section v-for="section in visibleSections" :key="section.title" class="pb-4">
          <h3 class="flex items-baseline gap-2 pb-2 font-medium text-stone-200">
            {{ section.title }}
            <span class="text-xs font-normal text-stone-400">{{ gameCount(section.rows.length) }}</span>
          </h3>
          <ul class="flex flex-col gap-1">
            <li v-for="row in section.rows" :key="row.id" class="relative rounded bg-stone-800">
              <details class="group">
                <summary
                  class="flex cursor-pointer list-none items-start gap-2 rounded px-3 py-2 pr-24 hover:bg-stone-700/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
                >
                  <IconUI
                    id="chevron-right"
                    size="sm"
                    class="mt-0.5 shrink-0 text-stone-400 transition-transform group-open:rotate-90"
                  />
                  <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="tabular-nums text-stone-400">{{ row.date }}</span>
                    <span class="text-stone-100">{{ row.script || "No script" }}</span>
                    <span
                      v-for="group in row.groups"
                      :key="group.rule"
                      class="rounded bg-stone-700 px-1.5 text-xs text-stone-200"
                    >
                      {{ rulePlural[group.rule] }}: {{ group.messages.length }}
                    </span>
                  </span>
                </summary>
                <div class="flex flex-col gap-2 px-3 pb-3 pl-9 text-xs">
                  <div v-for="group in row.groups" :key="group.rule">
                    <p class="font-medium text-stone-200">{{ rulePlural[group.rule] }}</p>
                    <ul class="text-stone-400">
                      <li v-for="(message, index) in group.messages" :key="index" class="break-words">
                        {{ message }}
                      </li>
                    </ul>
                  </div>
                </div>
              </details>
              <span class="absolute right-3 top-2 flex gap-3">
                <a :href="`/game/${row.id}`" target="_blank" class="game-link">
                  View<span class="sr-only"> {{ row.date }} {{ row.script || "No script" }} (opens in a new tab)</span>
                </a>
                <a :href="`/game/${row.id}/edit`" target="_blank" class="game-link">
                  Edit<span class="sr-only"> {{ row.date }} {{ row.script || "No script" }} (opens in a new tab)</span>
                </a>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import {
  GRIMOIRE_CHECK_RULES,
  GRIMOIRE_EVENT_RULES,
  checkGrimoire,
  type GrimoireCheckFinding,
  type GrimoireCheckGame,
  type GrimoireCheckRule,
} from "~/utils/grimoireChecks";

const props = defineProps<{
  visible: boolean;
  games: (GrimoireCheckGame & { id: string; date: string | Date; script: string | null })[];
}>();

const emit = defineEmits(["update:visible"]);

const ruleGroups = [
  { title: "Grimoire issues", rules: GRIMOIRE_CHECK_RULES },
  { title: "Incomplete events", rules: GRIMOIRE_EVENT_RULES },
];
const rules = [...GRIMOIRE_CHECK_RULES, ...GRIMOIRE_EVENT_RULES];
const rulePlural = Object.fromEntries(rules.map((rule) => [rule.id, rule.plural ?? rule.label]));
const enabledRules = ref<string[]>(
  rules.filter((rule) => !rule.offByDefault).map((rule) => rule.id)
);

function setGroup(groupRules: GrimoireCheckRule[], on: boolean) {
  const ids = new Set(groupRules.map((rule) => rule.id));
  const others = enabledRules.value.filter((id) => !ids.has(id));
  enabledRules.value = on ? [...others, ...ids] : others;
}

const gameCount = (count: number) => `${count} game${count === 1 ? "" : "s"}`;

type Row = {
  id: string;
  date: string;
  script: string | null;
  findings: GrimoireCheckFinding[];
};

// Only checked while the dialog is open.
const flaggedGames = computed<Row[]>(() => {
  if (!props.visible) return [];
  return [...props.games]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((game) => ({
      id: game.id,
      date: new Date(game.date).toLocaleDateString(),
      script: game.script,
      findings: checkGrimoire(game, rules),
    }))
    .filter((row) => row.findings.length);
});

/** Per rule: how many findings, and in how many games. */
const countByRule = computed(() => {
  const counts: Record<string, { findings: number; games: number }> = {};
  for (const row of flaggedGames.value) {
    const rules = new Set<string>();
    for (const finding of row.findings) {
      counts[finding.rule] ??= { findings: 0, games: 0 };
      counts[finding.rule].findings += 1;
      rules.add(finding.rule);
    }
    for (const rule of rules) counts[rule].games += 1;
  }
  return counts;
});

/** "572 in 134 games", or "None". */
function ruleCountText(ruleId: string) {
  const counts = countByRule.value[ruleId];
  return counts ? `${counts.findings} in ${gameCount(counts.games)}` : "None";
}

/** A game's findings for the given rules, grouped by rule in the rules' order. */
function groupFindings(row: Row, groupRules: GrimoireCheckRule[]) {
  return groupRules
    .filter((rule) => enabledRules.value.includes(rule.id))
    .map((rule) => ({
      rule: rule.id,
      messages: row.findings
        .filter((finding) => finding.rule === rule.id)
        .map((finding) => finding.message),
    }))
    .filter((group) => group.messages.length);
}

// A game with both kinds of findings shows in both sections, each time with
// only that section's findings.
const sections = computed(() =>
  ruleGroups.map((group) => {
    const ids = new Set(group.rules.map((rule) => rule.id));
    const rows = flaggedGames.value
      .filter((row) => row.findings.some((finding) => ids.has(finding.rule)))
      .map((row) => ({ ...row, groups: groupFindings(row, group.rules) }))
      .filter((row) => row.groups.length);
    return { title: group.title, rows };
  })
);

const visibleSections = computed(() => sections.value.filter((section) => section.rows.length));

const statusText = computed(() => {
  if (!props.visible) return "";
  if (!enabledRules.value.length) return "No checks selected.";
  if (!visibleSections.value.length) return "No games match the selected checks.";
  return visibleSections.value
    .map((section) => `${section.title}: ${gameCount(section.rows.length)}`)
    .join(", ");
});
</script>

<style scoped>
.check-list {
  scrollbar-width: thin;
  scrollbar-color: theme(colors.stone.600) transparent;
  scrollbar-gutter: stable;
}

.game-link {
  @apply text-stone-300 underline underline-offset-2 hover:text-white;
}

.check-toggle {
  @apply underline underline-offset-2 hover:text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500;
}

summary::-webkit-details-marker {
  display: none;
}
</style>
