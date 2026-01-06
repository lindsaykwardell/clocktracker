<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-sorts text-center text-xl lg:text-2xl">
      Alignment Insights
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-1 lg:grid-cols-3">
      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2">
        <h3 class="font-sorts text-center text-lg lg:text-xl">Draw Bias</h3>
        <div class="flex flex-col divide-y divide-stone-400 dark:divide-stone-700/40">
          <div
            v-for="item in biasItems"
            :key="item.title"
            class="flex items-center justify-between gap-3 text-sm md:text-base py-2"
          >
            <template v-if="item.entry">
              <div class="flex items-center gap-3">
                <Avatar
                  :value="item.entry.avatar || '/img/default.png'"
                  size="xs"
                  class="border-stone-800"
                  background
                />
                <div class="flex flex-col leading-tight">
                  <span class="text-stone-500 text-xs">{{ item.title }}</span>
                  <span class="font-semibold">
                    {{ item.entry.name }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end text-right">
                <span
                  class="font-semibold text-stone-700 dark:text-stone-300"
                  v-tooltip="{ content: item.detail || '', html: true }"
                  :style="item.entry.value > 0 ? `color: ${chartColors.evil}` : item.entry.value < 0 ? `color: ${chartColors.good}` : undefined"
                >
                  {{ formatBiasValue(item.entry.value) }}
                </span>
              </div>
            </template>
            <template v-else>
              <span class="text-stone-400 text-sm">{{ item.title }}</span>
              <span class="text-stone-400 text-xs">Not enough data</span>
            </template>
          </div>
        </div>
      </div>

      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-3">
        <h3 class="font-sorts text-center text-lg lg:text-xl">Switches</h3>
        <div class="flex flex-col divide-y divide-stone-400 dark:divide-stone-700/40">
          <div
            v-for="item in switchItems"
            :key="item.title"
            class="flex items-center justify-between gap-3 text-sm md:text-base py-2"
          >
            <div class="flex items-center gap-3">
              <div
                v-if="!item.entry"
                class="rounded-full shadow-lg w-8 md:w-10 h-8 md:h-10 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
              />
              <Avatar
                v-else
                :value="item.entry.avatar || '/img/default.png'"
                size="xs"
                class="border-stone-800"
                background
              />
              <div class="flex flex-col leading-tight">
                <span class="text-stone-500 text-xs">{{ item.title }}</span>
                <span v-if="item.entry" class="font-semibold">
                  {{ item.entry.name }}
                </span>
                <span v-else class="font-semibold text-stone-500">
                  No data
                </span>
              </div>
            </div>
            <span
              class="text-xs md:text-sm text-stone-700 dark:text-stone-300 font-semibold"
              :style="item.highlight === 'good' ? `color: ${chartColors.good}` : item.highlight === 'evil' ? `color: ${chartColors.evil}` : undefined"
            >
              {{ item.entry ? formatValue(item.entry.value, item.title) : '-' }}
            </span>
          </div>
        </div>
      </div>

      <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-3">
        <h3 class="font-sorts text-center text-lg lg:text-xl">Streaks</h3>
        <div class="flex flex-col divide-y divide-stone-400 dark:divide-stone-700/40">
          <div
            v-if="currentStreakEntry"
            class="flex items-center justify-between gap-3 text-sm md:text-base py-2"
          >
            <div class="flex items-center gap-3">
              <Avatar
                :value="currentStreakEntry.avatar || '/img/default.png'"
                size="xs"
                class="border-stone-800"
                background
              />
              <div class="flex flex-col leading-tight">
                <span class="text-stone-500 text-xs">Current streak</span>
                <span class="font-semibold">
                  {{ currentStreakEntry.name }}
                </span>
              </div>
            </div>
            <span
              class="text-xs md:text-sm text-stone-700 dark:text-stone-300 font-semibold"
              :style="currentStreakEntry.highlight === 'good' ? `color: ${chartColors.good}` : `color: ${chartColors.evil}`"
            >
              {{ formatValue(currentStreakEntry.value, 'streak', true) }}
            </span>
          </div>
          <div
            v-for="item in streakItems"
            :key="item.title"
            class="flex items-center justify-between gap-3 text-sm md:text-base py-2"
          >
            <template v-if="item.entry">
              <div class="flex items-center gap-3">
                <Avatar
                  :value="item.entry.avatar || '/img/default.png'"
                  size="xs"
                  class="border-stone-800"
                  background
                />
                <div class="flex flex-col leading-tight">
                  <span class="text-stone-500 text-xs">{{ item.title }}</span>
                  <span class="font-semibold">
                    {{ item.entry.name }}
                  </span>
                </div>
              </div>
              <span
                class="text-xs md:text-sm text-stone-700 dark:text-stone-300 font-semibold"
                :style="item.highlight === 'good' ? `color: ${chartColors.good}` : item.highlight === 'evil' ? `color: ${chartColors.evil}` : undefined"
              >
                {{ formatValue(item.entry.value, item.title, true) }}
              </span>
            </template>
            <template v-else>
              <span class="text-stone-400 text-sm">{{ item.title }}</span>
              <span class="text-stone-400 text-xs">Not enough data</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";
import { Status } from "~/composables/useFetchStatus";

type PlayerSummary = {
  user_id: string | null;
  username: string;
  avatar: string | null;
  plays: number;
  good_plays: number;
  evil_plays: number;
  roles: Record<string, number>;
};

type Entry = {
  name: string;
  avatar: string | null;
  value: number;
  detail?: string;
  highlight?: "good" | "evil";
};

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  players: PlayerSummary[];
}>();

const playerIndex = computed(() => {
  const map = new Map<string, PlayerSummary>();
  props.players.forEach((p) => {
    if (p.username) map.set(p.username.toLowerCase(), p);
  });
  return map;
});

type Alignment = "GOOD" | "EVIL" | null;
type PlayerGame = {
  name: string;
  alignment: Alignment;
  initial: Alignment | null;
  date: Date | null;
  expectedEvilProb: number;
  switches: number;
};

const perPlayerGames = computed<Map<string, PlayerGame[]>>(() => {
  const map = new Map<string, PlayerGame[]>();
  if (props.games.status !== Status.SUCCESS) return map;

  for (const game of props.games.data) {
    if (game.ignore_for_stats) continue;
    const date = game.date ? new Date(game.date) : null;

    const lastPage = game.grimoire?.[game.grimoire.length - 1];
    const tokens = lastPage?.tokens ?? [];
    const playerCount =
      (game as unknown as { player_count?: number })?.player_count ??
      tokens.filter((t) => t.role?.type !== "FABLED" && t.role?.type !== "LORIC").length;
    const evilSlots = evilSlotsForPlayers(playerCount);
    const expectedProb = playerCount > 0 ? evilSlots / playerCount : 0;

    // Build per-player alignment timelines across pages.
    const timelines = new Map<
      string,
      { aligns: Alignment[]; initials: Alignment[] }
    >();

    if (game.grimoire?.length) {
      for (const page of game.grimoire) {
        for (const token of page.tokens ?? []) {
          if (token.role?.type === "FABLED" || token.role?.type === "LORIC") continue;
          const name =
            token.player?.username ||
            token.player?.display_name ||
            token.player_name ||
            null;
          if (!name) continue;
          const alignment = (token.alignment as Alignment | null) ?? (token.role?.initial_alignment as Alignment | null) ?? null;
          if (!alignment) continue;
          const bucket = timelines.get(name) ?? { aligns: [], initials: [] };
          bucket.aligns.push(alignment);
          bucket.initials.push((token.role?.initial_alignment as Alignment | null) ?? alignment);
          timelines.set(name, bucket);
        }
      }
    } else if (game.player_characters?.length) {
      for (const pc of game.player_characters) {
        if (!pc.name) continue;
        const alignment = (pc.alignment as Alignment | null) ?? (pc.role?.initial_alignment as Alignment | null) ?? null;
        if (!alignment) continue;
        const bucket = timelines.get(pc.name) ?? { aligns: [], initials: [] };
        bucket.aligns.push(alignment);
        bucket.initials.push((pc.role?.initial_alignment as Alignment | null) ?? alignment);
        timelines.set(pc.name, bucket);
      }
    }

    for (const [name, data] of timelines.entries()) {
      const alignments = data.aligns;
      const initials = data.initials;
      if (!alignments.length) continue;
      const initial = initials[0] ?? alignments[0];
      const finalAlignment = alignments[alignments.length - 1];
      let switches = 0;
      for (let i = 1; i < alignments.length; i++) {
        if (alignments[i] && alignments[i] !== alignments[i - 1]) {
          switches++;
        }
      }

      const entry = {
        name,
        alignment: finalAlignment,
        initial,
        date,
        expectedEvilProb: expectedProb,
        switches,
      };
      const list = map.get(name) ?? [];
      list.push(entry);
      map.set(name, list);
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => {
      const aTime = a.date?.getTime() ?? 0;
      const bTime = b.date?.getTime() ?? 0;
      return aTime - bTime;
    });
  }

  return map;
});

const biasEntries = computed(() => {
  const results: Entry[] = [];
  for (const [name, games] of perPlayerGames.value.entries()) {
    const valid = games.filter((g) => g.alignment === "GOOD" || g.alignment === "EVIL");
    const total = valid.length;
    if (!total) continue;
    const actualEvil = valid.filter((g) => g.alignment === "EVIL").length;
    const expectedEvil = valid.reduce((sum, g) => sum + (g.expectedEvilProb || 0), 0);
    const actualRate = actualEvil / total;
    const expectedRate = total ? expectedEvil / total : 0;
    const bias = actualRate - expectedRate;
    results.push({
      ...toEntry(name, bias),
      detail: biasDetail(name),
    });
  }
  return results;
});

const mostEvilBias = computed(() =>
  biasEntries.value
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)[0] || null
);

const mostGoodBias = computed(() =>
  biasEntries.value
    .filter((e) => e.value < 0)
    .sort((a, b) => a.value - b.value)[0] || null
);

const biasItems = computed(() => [
  { title: "Strongest pull toward Evil tokens", entry: mostEvilBias.value, highlight: "evil", detail: mostEvilBiasDetail.value },
  { title: "Most balanced token pulls", entry: mostBalancedBias.value },
  { title: "Strongest pull toward Good tokens", entry: mostGoodBias.value, highlight: "good", detail: mostGoodBiasDetail.value },
]);

const mostEvilBiasDetail = computed(() => {
  if (!mostEvilBias.value) return "";
  return biasDetail(mostEvilBias.value.name);
});

const mostGoodBiasDetail = computed(() => {
  if (!mostGoodBias.value) return "";
  return biasDetail(mostGoodBias.value.name);
});

const mostBalancedBias = computed(() =>
  biasEntries.value
    .map((e) => ({ ...e, value: Math.abs(e.value) }))
    .sort((a, b) => a.value - b.value)
    .find((e) => e.value >= 0) || null
);

function biasDetail(name: string) {
  const games = perPlayerGames.value.get(name) || [];
  const valid = games.filter((g) => g.alignment === "GOOD" || g.alignment === "EVIL");
  const total = valid.length;
  if (!total) return "";
  const expectedEvil = valid.reduce((sum, g) => sum + (g.expectedEvilProb || 0), 0);
  const actualEvil = valid.filter((g) => g.alignment === "EVIL").length;
  const diffRate = total ? (actualEvil / total) - (expectedEvil / total) : 0;
  const pct = Math.round(diffRate * 100);
  return `<div class="text-balance max-w-44 space-y-2">
    <p>Based on ${total} game${total === 1 ? "" : "s"} played, this player was expected to draw an Evil token ${expectedEvil.toFixed(1)} time${expectedEvil === 1 ? "" : "s"}.</p>
    <p>They drew one ${actualEvil} time${actualEvil === 1 ? "" : "s"}, which is a difference of <span style="color:${diffRate >= 0 ? chartColors.evil : chartColors.good}; font-weight:600;">${pct >= 0 ? "+" : ""}${pct}%</span>.</p>
  </div>`;
}

const switchEntries = computed(() => {
  const switches: {
    name: string;
    switches: number;
    toGood: number;
    toEvil: number;
    winGood: number;
    winEvil: number;
  }[] = [];

  for (const [name, games] of perPlayerGames.value.entries()) {
    let totalSwitches = 0;
    let toGood = 0;
    let toEvil = 0;
    let winGood = 0;
    let winEvil = 0;
    for (const g of games) {
      totalSwitches += g.switches ?? 0;
      if (g.switches > 0 && g.alignment && g.initial && g.alignment !== g.initial) {
        if (g.alignment === "GOOD") {
          toGood += 1;
          // Successful if good team wins
          if ((g as any).win_v2 === "GOOD_WINS") winGood += 1;
        }
        if (g.alignment === "EVIL") {
          toEvil += 1;
          if ((g as any).win_v2 === "EVIL_WINS") winEvil += 1;
        }
      }
    }
    switches.push({ name, switches: totalSwitches, toGood, toEvil, winGood, winEvil });
  }
  return switches;
});

const mostSwitches = computed(() =>
  topBy(switchEntries.value, (s) => s.switches)
);
const mostSwitchesToGood = computed(() =>
  topBy(switchEntries.value, (s) => s.toGood)
);
const mostSwitchesToEvil = computed(() =>
  topBy(switchEntries.value, (s) => s.toEvil)
);

const switchItems = computed(() => [
  { title: "Most alignment switches", entry: mostSwitches.value },
  { title: "Most successful switches to Good", entry: topBy(switchEntries.value, (s) => s.winGood), highlight: "good" },
  { title: "Most successful switches to Evil", entry: topBy(switchEntries.value, (s) => s.winEvil), highlight: "evil" },
]);

const streakEntries = computed(() => {
  const res: { name: string; good: number; evil: number }[] = [];
  for (const [name, games] of perPlayerGames.value.entries()) {
    let longestGood = 0;
    let longestEvil = 0;
    let currentGood = 0;
    let currentEvil = 0;
    for (const g of games) {
      if (g.alignment === "GOOD") {
        currentGood += 1;
        currentEvil = 0;
      } else if (g.alignment === "EVIL") {
        currentEvil += 1;
        currentGood = 0;
      } else {
        currentGood = 0;
        currentEvil = 0;
      }
      longestGood = Math.max(longestGood, currentGood);
      longestEvil = Math.max(longestEvil, currentEvil);
    }
    res.push({ name, good: longestGood, evil: longestEvil });
  }
  return res;
});

const longestGoodStreak = computed(() =>
  topBy(streakEntries.value, (s) => s.good)
);
const longestEvilStreak = computed(() =>
  topBy(streakEntries.value, (s) => s.evil)
);

const streakItems = computed(() => [
  { title: "Longest Good streak", entry: longestGoodStreak.value, highlight: "good" },
  { title: "Longest Evil streak", entry: longestEvilStreak.value, highlight: "evil" },
]);

const currentStreakEntry = computed<Entry | null>(() => {
  let best: { name: string; alignment: Alignment; length: number } | null = null;

  for (const [name, games] of perPlayerGames.value.entries()) {
    const sorted = [...games].sort(
      (a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0)
    );
    let currentAlign: Alignment = null;
    let currentLen = 0;
    for (const g of sorted) {
      if (!g.alignment) continue;
      if (g.alignment === currentAlign) {
        currentLen++;
      } else {
        currentAlign = g.alignment;
        currentLen = 1;
      }
    }
    if (currentAlign && currentLen > 0) {
      if (!best || currentLen > best.length) {
        best = { name, alignment: currentAlign, length: currentLen };
      }
    }
  }

  if (!best) return null;
  const player = playerIndex.value.get(best.name.toLowerCase());
  return {
    name: player?.username || best.name,
    avatar: player?.avatar || null,
    value: best.length,
    highlight: best.alignment === "GOOD" ? "good" : "evil",
  };
});

function topBy<T extends { name: string }>(
  list: T[],
  get: (t: T) => number
): Entry | null {
  const sorted = [...list].sort((a, b) => get(b) - get(a));
  const top = sorted.find((item) => get(item) > 0);
  if (!top) return null;
  return toEntry(top.name, get(top));
}

function toEntry(name: string, value: number): Entry {
  const player = playerIndex.value.get(name.toLowerCase());
  return {
    name: player?.username || name,
    avatar: player?.avatar || null,
    value,
  };
}

function evilSlotsForPlayers(playerCount: number): number {
  if (playerCount <= 0) return 0;
  if (playerCount <= 9) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

function formatValue(value: number, title: string, isStreak: boolean = false) {
  if (isStreak || title.toLowerCase().includes("streak")) {
    return `${Math.round(value)} game${Math.round(value) === 1 ? "" : "s"}`;
  }
  return `${Math.round(value)}`;
}

function formatBiasValue(value: number) {
  const pct = Math.round(value * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}
</script>
