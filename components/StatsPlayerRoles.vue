<template>
  <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
    Played Roles
  </h2>

  <div v-if="!condensed" class="flex justify-center gap-2 mb-2 lg:mb-4">
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

  <div
    v-if="allRolesLoaded"
    class="grid gap-3 lg:grid-cols-6"
  >
    <div
      v-for="roleGroup in allRoles"
      :key="roleGroup.name"
      :class="{
        'col-span-1': roleGroup.name !== 'Townsfolk',
        'lg:col-span-2': roleGroup.name === 'Townsfolk',
      }"
    >
      <template v-if="!condensed">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ roleGroup.name }}
          <span class="text-base">({{ roleGroup.playedCount }}/{{ roleGroup.roles.length }})</span>
        </h3>
      </template>
      <template v-else >
        <h2 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ roleGroup.name }}
        </h2>
      </template>
      
      <ul class="flex flex-wrap justify-center gap-1">
        <li v-for="role in roleGroup.roles" :key="role.id">
          <nuxt-link :to="`/roles/${role.id}`">
            <div class="relative">
              <div
                v-if="!characterIsPlayed(role.id)"
                class="absolute top-0 left-0 bg-neutral-200/75 dark:bg-stone-800/75 rounded-full aspect-square w-full h-full z-10"
                v-tooltip="{ content: roleTooltip(role), html: true }"
              />
              <Token
                :character="{
                  role: role,
                  alignment: role.initial_alignment,
                }"
                size="sm"
                v-tooltip="{ content: roleTooltip(role), html: true }"
              />
            </div>
          </nuxt-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import { WinStatus_V2 } from "~/composables/useGames";

const roles = useRoles();

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  condensed?: boolean;
}>();

const filterLegacyRoles = <T extends { name: string }>(list?: T[]) =>
  (list ?? []).filter((role) => !role.name.includes("(Legacy)"));

const townsfolk = computed(() => {
  return naturalOrder(filterLegacyRoles(roles.getRoleByType(RoleType.TOWNSFOLK)))
    .orderBy("asc")
    .sort(["name"]);
});

const outsiders = computed(() => {
  return naturalOrder(filterLegacyRoles(roles.getRoleByType(RoleType.OUTSIDER)))
    .orderBy("asc")
    .sort(["name"]);
});

const minions = computed(() => {
  return naturalOrder(filterLegacyRoles(roles.getRoleByType(RoleType.MINION)))
    .orderBy("asc")
    .sort(["name"]);
});

const demons = computed(() => {
  return naturalOrder(filterLegacyRoles(roles.getRoleByType(RoleType.DEMON)))
    .orderBy("asc")
    .sort(["name"]);
});

const travelers = computed(() => {
  return naturalOrder(
    filterLegacyRoles(roles.getRoleByType(RoleType.TRAVELER))
  )
    .orderBy("asc")
    .sort(["name"]);
});

const allRolesLoaded = computed(() => {
  return (
    townsfolk.value.length &&
    outsiders.value.length &&
    minions.value.length &&
    demons.value.length &&
    travelers.value.length
  );
});

type RoleStats = {
  plays: number;
  wins: number;
  losses: number;
};

type SortMode = "alphabetical" | "plays" | "winRate";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Alphabetical", value: "alphabetical" },
  { label: "Most plays", value: "plays" },
  { label: "Highest win rate", value: "winRate" },
];

const sortMode = ref<SortMode>("alphabetical");

// Stats per role (plays, wins, losses)
const roleStats = computed<Map<string, RoleStats>>(() => {
  const stats = new Map<string, RoleStats>();

  if (props.games.status !== Status.SUCCESS) {
    return stats;
  }

  for (const game of props.games.data) {
    if (game.ignore_for_stats) continue;

    const goodWins = game.win_v2 === WinStatus_V2.GOOD_WINS;
    const evilWins = game.win_v2 === WinStatus_V2.EVIL_WINS;

    // Only count the final occurrence of each role_id per game to avoid double-counting role swaps.
    const lastRolePerGame = new Map<string, typeof game.player_characters[number]>();

    for (const character of game.player_characters) {
      if (!character.name || !character.role_id) continue;
      if (character.role?.type === "FABLED" || character.role?.type === "LORIC") continue;

      lastRolePerGame.set(character.role_id, character);
    }

    for (const character of lastRolePerGame.values()) {

      const alignment = character.alignment ?? character.role?.initial_alignment;
      const isGood = alignment === "GOOD";
      const isEvil = alignment === "EVIL";

      if (!stats.has(character.role_id)) {
        stats.set(character.role_id, {
          plays: 0,
          wins: 0,
          losses: 0,
        });
      }

      const roleStat = stats.get(character.role_id)!;
      roleStat.plays += 1;

      if (alignment && (goodWins || evilWins)) {
        if ((isGood && goodWins) || (isEvil && evilWins)) {
          roleStat.wins += 1;
        } else if ((isGood && evilWins) || (isEvil && goodWins)) {
          roleStat.losses += 1;
        }
      }
    }
  }

  return stats;
});

// Set of played role IDs for quick lookup
const playedRoleIds = computed<Set<string>>(
  () => new Set(roleStats.value.keys())
);

const formatPercent = (wins: number, losses: number) => {
  const total = wins + losses;
  if (!total) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
};

const roleTooltip = (role: { id: string; name: string }) => {
  const stats = roleStats.value.get(role.id);
  if (props.condensed) {
    return `${role.name}`;
  }

  if (!stats) {
    return `<strong>${role.name}</strong><br>Not played yet`;
  }

  else {
    return `<strong>${role.name}</strong><br>Games: ${stats.plays}<br>W/L: ${stats.wins}-${stats.losses} (${formatPercent(stats.wins, stats.losses)})`;
  }
};

const sortRoles = (list: typeof townsfolk.value) => {
  const rolesCopy = [...list];

  if (sortMode.value === "alphabetical") {
    return naturalOrder(rolesCopy).orderBy("asc").sort(["name"]);
  }

  const alphabetical = (a: any, b: any) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

  return rolesCopy.sort((a, b) => {
    const aStats = roleStats.value.get(a.id);
    const bStats = roleStats.value.get(b.id);

    if (sortMode.value === "plays") {
      const playDiff = (bStats?.plays ?? 0) - (aStats?.plays ?? 0);
      if (playDiff !== 0) return playDiff;

      const aTotal = (aStats?.wins ?? 0) + (aStats?.losses ?? 0);
      const bTotal = (bStats?.wins ?? 0) + (bStats?.losses ?? 0);
      const aRate = aTotal ? (aStats?.wins ?? 0) / aTotal : -1;
      const bRate = bTotal ? (bStats?.wins ?? 0) / bTotal : -1;

      if (bRate !== aRate) return bRate - aRate;
    }

    if (sortMode.value === "winRate") {
      const aTotal = (aStats?.wins ?? 0) + (aStats?.losses ?? 0);
      const bTotal = (bStats?.wins ?? 0) + (bStats?.losses ?? 0);
      const aRate = aTotal ? (aStats?.wins ?? 0) / aTotal : -1;
      const bRate = bTotal ? (bStats?.wins ?? 0) / bTotal : -1;

      if (bRate !== aRate) return bRate - aRate;

      const playDiff = (bStats?.plays ?? 0) - (aStats?.plays ?? 0);
      if (playDiff !== 0) return playDiff;
    }

    // Fallback to alphabetical for consistent ordering
    return alphabetical(a, b);
  });
};

// Role groups + played counts
const allRoles = computed(() => {
  const baseGroups = [
    { name: "Townsfolk", roles: townsfolk.value },
    { name: "Outsiders", roles: outsiders.value },
    { name: "Minions", roles: minions.value },
    { name: "Demons", roles: demons.value },
    { name: "Travelers", roles: travelers.value },
  ];

  return baseGroups.map((group) => {
    const sortedRoles = sortRoles(group.roles);
    const playedCount = sortedRoles.filter((role) =>
      playedRoleIds.value.has(role.id)
    ).length;

    return {
      ...group,
      roles: sortedRoles,
      playedCount,
    };
  });
});

// Used by the overlay
const characterIsPlayed = (roleId: string) => playedRoleIds.value.has(roleId);

onMounted(() => {
  roles.fetchRoles();
});
</script>
