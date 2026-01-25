<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Storytold Characters
    </h2>

    <div v-if="!condensed" class="flex justify-center gap-2 mb-2 lg:mb-4">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        type="button"
        class="px-3 py-1 text-sm rounded-full border transition-colors"
        :class="{
          'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100':
            sortMode === option.value,
          'bg-white/60 dark:bg-stone-900/40 border-stone-300 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500':
            sortMode !== option.value,
        }"
        @click="sortMode = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div
      v-if="allRolesLoaded"
      class="grid gap-3 lg:grid-cols-7"
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
            <span class="text-base">({{ roleGroup.storytoldCount }}/{{ roleGroup.roles.length }})</span>
          </h3>
        </template>
        <template v-else>
          <h2 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
            {{ roleGroup.name }}
          </h2>
        </template>

        <ul class="flex flex-wrap justify-center gap-1">
          <li v-for="role in roleGroup.roles" :key="role.id">
            <nuxt-link :to="roleLink(role.id)">
              <div class="relative">
                <div
                  v-if="!roleWasStorytold(role.id)"
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
import { computed, onMounted, ref } from "vue";
import naturalOrder from "natural-order";
import type { Alignment } from "@prisma/client";
import type { GameRecord } from "~/composables/useGames";
import { filterStorytellerGames } from "~/composables/useGames";
import type { RoleType } from "~/composables/useRoles";
import type { FetchStatus } from "~/composables/useFetchStatus";
import { Status } from "~/composables/useFetchStatus";

const rolesStore = useRoles();

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  username: string;
  condensed?: boolean;
}>();

type ScriptRole = {
  id: string;
  name: string;
  token_url: string | null;
  initial_alignment: Alignment;
  type: RoleType;
};

type RoleUsage = {
  storytold: number;
  bluffs: number;
};

type SortMode = "alphabetical" | "storytold" | "bluffs";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Alphabetical", value: "alphabetical" },
  { label: "Most storytold", value: "storytold" },
  { label: "Most as bluff", value: "bluffs" },
];

const sortMode = ref<SortMode>("alphabetical");

/**
 * Storyteller games for this user.
 */
const storytellerGames = computed(() =>
  props.games.status === Status.SUCCESS
    ? filterStorytellerGames(props.games.data, props.username)
    : []
);

/**
 * Track how often a role appeared in a game the user storytold,
 * and how often it was shown as a bluff.
 *
 * - "storytold" counts once per game when the role was in the grimoire
 *   (any page) or added as Fabled/Loric.
 * - "bluffs" counts each time it was given as a demon bluff.
 */
const roleUsage = computed<Map<string, RoleUsage>>(() => {
  const usage = new Map<string, RoleUsage>();

  const ensureEntry = (roleId: string) => {
    if (!usage.has(roleId)) {
      usage.set(roleId, { storytold: 0, bluffs: 0 });
    }
    return usage.get(roleId)!;
  };

  for (const game of storytellerGames.value) {
    const storytoldIds = new Set<string>();

    for (const page of game.grimoire ?? []) {
      for (const token of page?.tokens ?? []) {
        const roleId = token.role_id ?? undefined;
        if (roleId) {
          storytoldIds.add(roleId);
        }
      }
    }

    for (const fabled of game.fabled ?? []) {
      const roleId = fabled.role_id ?? undefined;
      if (roleId) {
        storytoldIds.add(roleId);
      }
    }

    for (const roleId of storytoldIds) {
      ensureEntry(roleId).storytold += 1;
    }

    for (const bluff of game.demon_bluffs ?? []) {
      const roleId = bluff.role_id ?? undefined;
      if (roleId) {
        ensureEntry(roleId).bluffs += 1;
      }
    }
  }

  return usage;
});

const roleWasStorytold = (roleId: string) =>
  (roleUsage.value.get(roleId)?.storytold ?? 0) > 0;

const roleTooltip = (role: { id: string; name: string }) => {
  const usage = roleUsage.value.get(role.id);
  

  if (props.condensed) {
    return `${role.name}`; // Only output the role name.
  }

  if (!usage) {
    return `<strong>${role.name}</strong><br>Not storytold yet`;
  }

  const lines = [`<strong>${role.name}</strong>`];

  if (usage.storytold > 0) {
    lines.push(`Storytold: ${usage.storytold}`);
  } else {
    lines.push("Not storytold yet");
  }

  lines.push(`As bluff: ${usage.bluffs}`);

  return lines.join("<br>");
};

const filterLegacyRoles = <T extends { name: string }>(list?: T[]) =>
  (list ?? []).filter((role) => !role.name.includes("(Legacy)"));

const townsfolk = computed(() => {
  return naturalOrder(
    filterLegacyRoles(
      rolesStore.getRoleByType("TOWNSFOLK" as RoleType) ?? []
    ) as ScriptRole[]
  )
    .orderBy("asc")
    .sort(["name"]);
});

const outsiders = computed(() => {
  return naturalOrder(
    filterLegacyRoles(
      rolesStore.getRoleByType("OUTSIDER" as RoleType) ?? []
    ) as ScriptRole[]
  )
    .orderBy("asc")
    .sort(["name"]);
});

const minions = computed(() => {
  return naturalOrder(
    filterLegacyRoles(
      rolesStore.getRoleByType("MINION" as RoleType) ?? []
    ) as ScriptRole[]
  )
    .orderBy("asc")
    .sort(["name"]);
});

const demons = computed(() => {
  return naturalOrder(
    filterLegacyRoles(
      rolesStore.getRoleByType("DEMON" as RoleType) ?? []
    ) as ScriptRole[]
  )
    .orderBy("asc")
    .sort(["name"]);
});

const travelers = computed(() => {
  return naturalOrder(
    filterLegacyRoles(
      rolesStore.getRoleByType("TRAVELER" as RoleType) ?? []
    ) as ScriptRole[]
  )
    .orderBy("asc")
    .sort(["name"]);
});

const npcs = computed(() => {
  const list = filterLegacyRoles([
    ...(rolesStore.getRoleByType("FABLED" as RoleType) ?? []),
    ...(rolesStore.getRoleByType("LORIC" as RoleType) ?? []),
  ]) as ScriptRole[];

  return naturalOrder(list).orderBy("asc").sort(["name"]);
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

const sortRoles = (list: ScriptRole[]) => {
  const rolesCopy = [...list];

  if (sortMode.value === "alphabetical") {
    return naturalOrder(rolesCopy).orderBy("asc").sort(["name"]);
  }

  const alphabetical = (a: ScriptRole, b: ScriptRole) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

  return rolesCopy.sort((a, b) => {
    const aUsage = roleUsage.value.get(a.id);
    const bUsage = roleUsage.value.get(b.id);

    if (sortMode.value === "storytold") {
      const diff = (bUsage?.storytold ?? 0) - (aUsage?.storytold ?? 0);
      if (diff !== 0) return diff;

      const bluffDiff = (bUsage?.bluffs ?? 0) - (aUsage?.bluffs ?? 0);
      if (bluffDiff !== 0) return bluffDiff;
    }

    if (sortMode.value === "bluffs") {
      const bluffDiff = (bUsage?.bluffs ?? 0) - (aUsage?.bluffs ?? 0);
      if (bluffDiff !== 0) return bluffDiff;

      const diff = (bUsage?.storytold ?? 0) - (aUsage?.storytold ?? 0);
      if (diff !== 0) return diff;
    }

    return alphabetical(a, b);
  });
};

const allRoles = computed(() => {
  const baseGroups = [
    { name: "Townsfolk", roles: townsfolk.value },
    { name: "Outsiders", roles: outsiders.value },
    { name: "Minions", roles: minions.value },
    { name: "Demons", roles: demons.value },
    { name: "Travelers", roles: travelers.value },
    { name: "NPCs", roles: npcs.value },
  ];

  return baseGroups.map((group) => {
    const sortedRoles = sortRoles(group.roles);
    const storytoldCount = sortedRoles.filter((role) =>
      roleWasStorytold(role.id)
    ).length;

    return {
      ...group,
      roles: sortedRoles,
      storytoldCount,
    };
  });
});

const roleLink = (id?: string) => {
  if (!id) return "#";
  return `/roles/${id}`;
};

onMounted(() => {
  (rolesStore.fetchRoles?.() as Promise<unknown> | undefined)?.catch?.(
    (e: unknown) =>
      console.error("Failed to fetch roles for storyteller roles", e)
  );
});
</script>
