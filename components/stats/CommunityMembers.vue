<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-sorts text-center text-xl lg:text-2xl">
      By Player
    </h2>

    <div class="flex justify-center gap-2">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        type="button"
        class="px-3 py-1 text-sm rounded-full border transition-colors"
        :class="{
          'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100': sortMode === option.value,
          'bg-white/60 dark:bg-stone-900/40 border-stone-300 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500': sortMode !== option.value,
        }"
        @click="sortMode = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="flex flex-col gap-3 md:gap-4">
      <div
        v-for="group in grouped"
        :key="group.key"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2">
          {{ group.title }}
        </h3>
        <ul class="flex flex-wrap justify-center gap-1">
          <template v-if="group.people.length">
            <li
              v-for="person in visiblePeople(group)"
              class="relative"
              :key="person.username + (person.user_id || '')"
            >
              <div
                v-if="!person.user_id"
                class="rounded-full object-cover shadow-lg border w-8 md:w-10 h-8 md:h-10 aspect-square flex items-center justify-center text-stone-100 bg-stone-800"
                v-tooltip="{ content: person.tooltip, html: true }"
              >
                {{ initials(person.display_name || person.username) }}
              </div>
              <component
                v-else
                :is="NuxtLink"
                :to="`/@${person.username}`"
                class="inline-flex"
              >
                <Avatar
                  :value="person.avatar || '/img/default.png'"
                  size="sm-token"
                  class="border-stone-800"
                  background
                  v-tooltip="{ content: person.tooltip, html: true }"
                />
              </component>
            </li>
          </template>
        </ul>
        <div
          v-if="shouldShowNonUserToggle(group)"
          class="flex justify-center mt-4"
        >
          <Button
            type="button"
            @click="showAllNonUsers = !showAllNonUsers"
            variant="soft"
            size="xs"
          >
            {{ showAllNonUsers ? "Show less" : `Show more (${remainingNonUsers(group)})` }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, resolveComponent } from "vue";
import type { PlayerSummary } from "~/composables/useCommunityStats";
import { escapeHtml, getRedactedNameHtml } from "~/composables/useRedactedName";

const props = defineProps<{
  players: PlayerSummary[];
  memberIds?: string[];
  anonymizeNonUsers?: boolean;
}>();

const NuxtLink = resolveComponent("nuxt-link");

type Person = {
  user_id: string | null;
  username: string;
  display_name: string;
  avatar: string | null;
  tooltip: string;
};

type Group = {
  key: string;
  title: string;
  filter: (p: PlayerSummary) => boolean;
  people: Person[];
};

type SortMode = "alphabetical" | "plays" | "winRate" | "storytold";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Alphabetical", value: "alphabetical" },
  { label: "Most plays", value: "plays" },
  { label: "Most storytold", value: "storytold" },
  { label: "Highest win rate", value: "winRate" },
];

const sortMode = ref<SortMode>("alphabetical");
const nonUsersLimit = 54; // 54 fits 2 lines on desktop.
const showAllNonUsers = ref(false);

/**
 * Group players by membership and apply sorting within each group.
 */
const grouped = computed(() => {
  const members = new Set(props.memberIds || []);

  const groups: Group[] = [
    {
      key: "members",
      title: "Community Members",
      filter: (p) => !!p.user_id && members.has(p.user_id),
      people: [],
    },
    {
      key: "users",
      title: "Clocktracker Users",
      filter: (p) => !!p.user_id && !members.has(p.user_id),
      people: [],
    },
    {
      key: "anonymous",
      title: "Non-Users",
      filter: (p) => !p.user_id,
      people: [],
    },
  ];

  for (const player of props.players || []) {
    const person: Person = {
      user_id: player.user_id,
      username: player.username,
      display_name: player.display_name || player.username,
      avatar: player.avatar,
      tooltip: buildTooltip(player),
    };
    const bucket = groups.find((g) => g.filter(player));
    if (bucket) bucket.people.push(person);
  }

  groups.forEach((g) => {
    g.people.sort((a, b) => comparePeople(a, b));
  });

  return groups.filter((g) => g.people.length);
});

const visiblePeople = (group: Group) => {
  if (group.key !== "anonymous" || showAllNonUsers.value) {
    return group.people;
  }
  return group.people.slice(0, nonUsersLimit);
};

const shouldShowNonUserToggle = (group: Group) =>
  group.key === "anonymous" && group.people.length > nonUsersLimit;

const remainingNonUsers = (group: Group) =>
  Math.max(group.people.length - nonUsersLimit, 0);

/**
 * Compare two people according to the selected sort mode.
 */
function comparePeople(a: Person, b: Person) {
  const pa = props.players.find((p) =>
    a.user_id ? p.user_id === a.user_id : p.username === a.username
  );
  const pb = props.players.find((p) =>
    b.user_id ? p.user_id === b.user_id : p.username === b.username
  );

  const playsA = pa?.plays ?? 0;
  const playsB = pb?.plays ?? 0;
  const storyA = pa?.storyteller_plays ?? 0;
  const storyB = pb?.storyteller_plays ?? 0;
  const rateA = playsA > 0 ? (pa?.wins ?? 0) / playsA : 0;
  const rateB = playsB > 0 ? (pb?.wins ?? 0) / playsB : 0;

  if (sortMode.value === "alphabetical") {
    const nameDiff = (a.display_name || "").localeCompare(
      b.display_name || "",
      undefined,
      { sensitivity: "base" }
    );
    if (nameDiff !== 0) return nameDiff;
  } 
  else if (sortMode.value === "plays") {
    if (playsB !== playsA) return playsB - playsA;
    if (rateB !== rateA) return rateB - rateA;
  } 
  else if (sortMode.value === "winRate") {
    if (rateB !== rateA) return rateB - rateA;
    if (playsB !== playsA) return playsB - playsA;
  } 
  else if (sortMode.value === "storytold") {
    if (storyB !== storyA) return storyB - storyA;
    if (playsB !== playsA) return playsB - playsA;
    if (rateB !== rateA) return rateB - rateA;
  } 
  else {
    if (playsB !== playsA) return playsB - playsA;
  }

  return 0;
}

/**
 * Build tooltip HTML for a player summary.
 */
function buildTooltip(player: PlayerSummary) {
  const games = player.plays ?? 0;
  const wins = player.wins ?? 0;
  const losses = Math.max(games - wins, 0);
  const stories = player.storyteller_plays ?? 0;
  const rate = games > 0 ? Math.round((wins / games) * 100) : 0;
  const topRole = mostPlayedRole(player);
  const roleText = topRole ? `${topRole.name} (${topRole.count})` : "None";
  const nameHtml = nameHtmlFor(player);
  return `<strong>${nameHtml}</strong><br>Games played: ${games}<br>Games storytold: ${stories}<br>W/L: ${wins}-${losses} (${rate}%)<br>Most played: ${roleText}`;
}

const nameHtmlFor = (player: PlayerSummary) => {
  const name = player.display_name || player.username || "Unknown";
  if (props.anonymizeNonUsers && !player.user_id) {
    return getRedactedNameHtml(name);
  }
  return escapeHtml(name);
};

/**
 * Initials for anonymous (non-user) players.
 *
 * Ab for single name, AB for others.
 */
function initials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    const chars = (parts[0]?.[0] ?? "") + (parts[parts.length - 1][0] ?? "");
    return chars.toUpperCase();
  }
  const first = parts[0] ?? "";
  const firstChar = (first[0] ?? "").toUpperCase();
  const secondChar = (first[1] ?? "").toLowerCase();
  return firstChar + secondChar;
}

/**
 * Most-played role summary for tooltips.
 */
function mostPlayedRole(player: PlayerSummary) {
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of Object.entries(player.roles || {})) {
    if (!best || count > best.count) {
      best = { name, count };
    }
  }
  return best;
}
</script>
