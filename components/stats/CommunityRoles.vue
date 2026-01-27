<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-sorts text-center text-xl lg:text-2xl">
      Played Characters
    </h2>

    <div class="flex justify-center gap-2 mb-2 lg:mb-4">
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
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ roleGroup.name }}
          <span class="text-base">({{ roleGroup.playedCount }}/{{ roleGroup.roles.length }})</span>
        </h3>

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
  </div>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";
import { Status, type FetchStatus } from "~/composables/useFetchStatus";
import type { RoleType } from "~/composables/useRoles";
import type { PlayerSummary } from "~/composables/useCommunityStats";
import { escapeHtml, getRedactedNameHtml } from "~/composables/useRedactedName";

const roles = useRoles();

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  players?: PlayerSummary[];
  anonymizeNonUsers?: boolean;
}>();

/**
 * Filter out legacy roles from lists.
 */
const filterLegacyRoles = <T extends { name: string }>(list?: T[]) =>
  (list ?? []).filter((role) => !role.name.includes("(Legacy)"));

/**
 * Role groups by type.
 */
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
  return naturalOrder(filterLegacyRoles(roles.getRoleByType(RoleType.TRAVELER)))
    .orderBy("asc")
    .sort(["name"]);
});

/**
 * Ensure all role groups loaded before rendering.
 */
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
  topPlayer?: string;
  topPlayerHtml?: string;
};

type SortMode = "alphabetical" | "plays" | "winRate";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Alphabetical", value: "alphabetical" },
  { label: "Most plays", value: "plays" },
  { label: "Highest win rate", value: "winRate" },
];

const sortMode = ref<SortMode>("alphabetical");

/**
 * Lookup for role name -> role id.
 */
const roleNameToId = computed(() => {
  const map = new Map<string, string>();
  [
    ...townsfolk.value,
    ...outsiders.value,
    ...minions.value,
    ...demons.value,
    ...travelers.value,
  ].forEach((role) => {
    map.set(role.name.toLowerCase(), role.id);
  });
  return map;
});

/**
 * Stats per role (plays, wins, losses, top player).
 * Prefers grimoire tokens; falls back to player_characters.
 */
const roleStats = computed<Map<string, RoleStats>>(() => {
  const stats = new Map<string, RoleStats>();

  if (props.games.status !== Status.SUCCESS) {
    return stats;
  }

  for (const game of props.games.data) {
    if (game.ignore_for_stats) continue;

    const goodWins = game.win_v2 === WinStatus_V2.GOOD_WINS;
    const evilWins = game.win_v2 === WinStatus_V2.EVIL_WINS;

    const lastPage = game.grimoire?.[game.grimoire.length - 1];
    const tokenRoles = new Map<
      string,
      { alignment: string | null; initial: string | null }
    >();

    if (lastPage?.tokens?.length) {
      for (const token of lastPage.tokens) {
        const roleName = token.role?.name;
        if (!roleName) continue;
        if (token.role?.type === "FABLED" || token.role?.type === "LORIC") continue;
        const roleId = roleNameToId.value.get(roleName.toLowerCase());
        if (!roleId) continue;
        tokenRoles.set(roleId, {
          alignment: token.alignment ?? token.role?.initial_alignment ?? null,
          initial: token.role?.initial_alignment ?? null,
        });
      }
    }

    const lastRolePerGame = new Map<string, typeof game.player_characters[number]>();

    for (const character of game.player_characters) {
      if (!character.name || !character.role_id) continue;
      if (character.role?.type === "FABLED" || character.role?.type === "LORIC") continue;

      lastRolePerGame.set(character.role_id, character);
    }

    // Prefer grimoire tokens, fall back to player_characters
    if (tokenRoles.size) {
      for (const [roleId, info] of tokenRoles.entries()) {
        if (!stats.has(roleId)) {
          stats.set(roleId, {
            plays: 0,
            wins: 0,
            losses: 0,
          });
        }
        const roleStat = stats.get(roleId)!;
        roleStat.plays += 1;

        const alignment = info.alignment ?? info.initial;
        const isGood = alignment === "GOOD";
        const isEvil = alignment === "EVIL";
        if (alignment && (goodWins || evilWins)) {
          if ((isGood && goodWins) || (isEvil && evilWins)) {
            roleStat.wins += 1;
          } else if ((isGood && evilWins) || (isEvil && goodWins)) {
            roleStat.losses += 1;
          }
        }
      }
    } else {
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
  }

  if (props.players?.length) {
    const topCounts = new Map<string, { name: string; count: number; html: string }>();

    for (const player of props.players) {
      const displayName = player.display_name || player.username;
      const htmlName = props.anonymizeNonUsers && !player.user_id
        ? getRedactedNameHtml(displayName)
        : escapeHtml(displayName);
      for (const [roleName, count] of Object.entries(player.roles || {})) {
        const roleId = roleNameToId.value.get(roleName.toLowerCase());
        if (!roleId) continue;
        const current = topCounts.get(roleId);
        if (!current || count > current.count) {
          topCounts.set(roleId, { name: displayName, html: htmlName, count });
        }
      }
    }

    for (const [roleId, info] of topCounts.entries()) {
      const stat = stats.get(roleId);
      if (stat) {
        stat.topPlayer = info.name;
        stat.topPlayerHtml = info.html;
      }
    }
  }

  return stats;
});

/**
 * Set of played role IDs for quick lookup.
 */
const playedRoleIds = computed<Set<string>>(
  () => new Set(roleStats.value.keys())
);

/**
 * Format win percentage for tooltips.
 */
const formatPercent = (wins: number, losses: number) => {
  const total = wins + losses;
  if (!total) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
};

/**
 * Tooltip content per role.
 */
const roleTooltip = (role: { id: string; name: string }) => {
  const stats = roleStats.value.get(role.id);

  if (!stats) {
    return `<strong>${role.name}</strong><br>Not played yet`;
  }

  const topLine = stats.topPlayerHtml ? `<br>Most played by: ${stats.topPlayerHtml}` : "";
  return `<strong>${role.name}</strong><br>Games: ${stats.plays}<br>W/L: ${stats.wins}-${stats.losses} (${formatPercent(stats.wins, stats.losses)})${topLine}`;
};

/**
 * Sort roles by selected mode.
 */
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

    return alphabetical(a, b);
  });
};

/**
 * Role groups with played counts.
 */
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

const characterIsPlayed = (roleId: string) => playedRoleIds.value.has(roleId);

onMounted(() => {
  roles.fetchRoles();
});
</script>
