<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Highlights
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <!-- Most storytold character -->
      <div
        class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Most Storytold<span class="sr-only xl:not-sr-only"> Character</span>
        </h3>

        <div v-if="mostStorytold" class="flex flex-col items-center gap-2">
          <nuxt-link :to="roleLink(mostStorytold.id)" class="hover:underline">
            <Token
              :character="{
                role: {
                  name: mostStorytold.name,
                  token_url: mostStorytold.token_url,
                  initial_alignment: mostStorytold.initial_alignment,
                },
                alignment: mostStorytold.initial_alignment,
              }"
              size="lg"
              v-tooltip="`${mostStorytold.name} (${mostStorytold.total})`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            {{ roleArticle(mostStorytold.name) }}<span class="font-semibold">{{ mostStorytold.name }}</span> 
            made an appearance in {{ mostStorytold.total }} game<span v-if="mostStorytold.total !== 1">s</span>.
          </div>
        </div>

        <div v-else class="flex flex-col items-center flex-grow gap-2">
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <p class="text-center text-sm text-stone-400 text-balance">
            No characters recorded yet.
          </p>
        </div>
      </div>

      <!-- Favorite bluff -->
      <div
        class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Favorite Bluff
        </h3>

        <div v-if="favoriteBluff" class="flex flex-col items-center gap-2">
          <nuxt-link :to="roleLink(favoriteBluff.id)" class="hover:underline">
            <Token
              :character="{
                role: {
                  name: favoriteBluff.name,
                  token_url: favoriteBluff.token_url,
                  initial_alignment: favoriteBluff.initial_alignment,
                },
                alignment: favoriteBluff.initial_alignment,
              }"
              size="lg"
              v-tooltip="`${favoriteBluff.name} (${favoriteBluff.bluffs})`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-44">
            {{ roleArticle(favoriteBluff.name) }}<span class="font-semibold">{{ favoriteBluff.name }}</span> 
            was shown to the demon a total of {{ favoriteBluff.bluffs }} time<span v-if="favoriteBluff.bluffs !== 1">s</span>!
          </div>
        </div>

        <div v-else class="flex flex-col items-center flex-grow gap-2">
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <p class="text-center text-sm text-stone-400 text-balance">
            No bluffs recorded yet.
          </p>
        </div>
      </div>

      <!-- Favorite NPC (Fabled / Loric) -->
      <div
        class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          Favorite NPC
        </h3>

        <div v-if="favoriteNpc" class="flex flex-col items-center gap-2">
          <nuxt-link :to="roleLink(favoriteNpc.id)" class="hover:underline">
            <Token
              :character="{
                role: {
                  name: favoriteNpc.name,
                  token_url: favoriteNpc.token_url,
                  initial_alignment: favoriteNpc.initial_alignment,
                },
                alignment: favoriteNpc.initial_alignment,
              }"
              size="lg"
              v-tooltip="`${favoriteNpc.name} (${favoriteNpc.npcUses})`"
            />
          </nuxt-link>

          <div class="text-center text-sm text-balance max-w-40">
            {{ roleArticle(favoriteNpc.name) }}<span class="font-semibold">{{ favoriteNpc.name }}</span> 
            was added to {{ favoriteNpc.npcUses }} game<span v-if="favoriteNpc.npcUses !== 1">s</span>.
          </div>
        </div>

        <div v-else class="flex flex-col items-center flex-grow gap-2">
          <div
            class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
          />
          <p class="text-center text-sm text-stone-400 text-balance">
            No Fabled or Loric recorded yet.
          </p>
        </div>
      </div>

      <!-- Game balance -->
      <div
        class="lg:col-start-2 xl:col-start-4 p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Game Balance
        </h3>

        <StatsStorytellerBalance
          :games="storytellerGames"
          :username="username"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { Alignment } from "@prisma/client";
import type { RoleType } from "~/composables/useRoles";
import type { GameRecord } from "~/composables/useGames";
import { filterStorytellerGames } from "~/composables/useGames";

const rolesStore = useRoles();

const props = defineProps<{
  games: GameRecord[];
  username: string;
}>();

onMounted(() => {
  // Make sure roles are available so we can resolve IDs to full role info.
  // Ignore errors – component will just show "not enough data" until loaded.
  (rolesStore.fetchRoles?.() as Promise<unknown> | undefined)?.catch?.(
    (e: unknown) => console.error("Failed to fetch roles for storyteller highlights", e)
  );
});

type ScriptRole = {
  id: string;
  name: string;
  token_url: string | null;
  type: RoleType;
  initial_alignment: Alignment;
};

type RoleUsage = {
  roleId: string;
  total: number;
  bluffs: number;
  npcUses: number;
};

type HighlightRole = {
  id: string;
  name: string;
  token_url: string | null;
  type: RoleType;
  initial_alignment?: Alignment;
  total: number;
  bluffs: number;
  npcUses: number;
};

/**
 * Storyteller games for this user.
 */
const storytellerGames = computed(() =>
  filterStorytellerGames(props.games, props.username)
);

/**
 * Aggregate usage across all storyteller games:
 * - total: number of games where this character appeared
 *          (any grimoire page OR as Fabled/Loric)
 * - bluffs: times used as demon bluff
 * - npcUses: times used as NPC (FABLED / LORIC via game.fabled)
 */
const roleUsageMap = computed<Map<string, RoleUsage>>(() => {
  const map = new Map<string, RoleUsage>();

  const getEntry = (roleId: string): RoleUsage => {
    let entry = map.get(roleId);

    if (!entry) {
      entry = { roleId, total: 0, bluffs: 0, npcUses: 0 };
      map.set(roleId, entry);
    }

    return entry;
  };

  for (const game of storytellerGames.value) {
    const usedIdsInGame = new Set<string>();

    // All grimoire pages.
    const pages = game.grimoire ?? [];

    for (const page of pages) {
      const tokens = page?.tokens ?? [];

      for (const token of tokens) {
        const roleId = token.role_id ?? undefined;

        if (!roleId) continue;

        usedIdsInGame.add(roleId);
      }
    }

    // Fabled / Loric (NPCs) – may or may not be in the grimoire.
    for (const fabled of game.fabled ?? []) {
      const roleId = fabled.role_id ?? undefined;

      if (!roleId) continue;

      usedIdsInGame.add(roleId);
    }

    // Count "total" once per game per role.
    for (const roleId of usedIdsInGame) {
      const entry = getEntry(roleId);
      entry.total++;
    }

    // Demon bluffs, counted separately.
    for (const bluff of game.demon_bluffs ?? []) {
      const roleId = bluff.role_id ?? undefined;

      if (!roleId) continue;

      const entry = getEntry(roleId);
      entry.bluffs++;
    }

    // NPC usage, how often a Fabled/Loric was used.
    for (const fabled of game.fabled ?? []) {
      const roleId = fabled.role_id ?? undefined;

      if (!roleId) continue;

      const entry = getEntry(roleId);
      entry.npcUses++;
    }
  }

  return map;
});

/**
 * All known roles loaded from the roles store.
 */
const allRoles = computed<ScriptRole[]>(() => {
  return (rolesStore.getAllRoles?.() ?? []) as ScriptRole[];
});

/**
 * Helper to resolve a single "highlight" role based on:
 * - a filter predicate (which roles are eligible)
 * - a scoring function (what we rank by)
 *
 * Ties are broken by:
 * - higher total usage
 * - then alphabetical role name
 */
function resolveHighlight(
  filter: (role: ScriptRole, usage: RoleUsage) => boolean,
  score: (usage: RoleUsage) => number
): HighlightRole | null {
  const rolesById = new Map(allRoles.value.map((r) => [r.id, r]));
  let best: { role: ScriptRole; usage: RoleUsage } | null = null;

  for (const usage of roleUsageMap.value.values()) {
    const role = rolesById.get(usage.roleId);
    if (!role) continue;
    if (!filter(role, usage)) continue;

    const value = score(usage);
    if (!best) {
      best = { role, usage };
      continue;
    }

    const bestValue = score(best.usage);

    if (value > bestValue) {
      best = { role, usage };
    } 
    else if (value === bestValue) {
      if (usage.total > best.usage.total) {
        best = { role, usage };
      } 
      else if (
        usage.total === best.usage.total &&
        role.name.localeCompare(best.role.name) < 0
      ) {
        best = { role, usage };
      }
    }
  }

  if (!best) return null;

  const { role, usage } = best;
  return {
    id: role.id,
    name: role.name,
    token_url: role.token_url ?? null,
    type: role.type,
    initial_alignment: role.initial_alignment,
    total: usage.total,
    bluffs: usage.bluffs,
    npcUses: usage.npcUses,
  };
}

/**
 * Most storytold character:
 * - Any non-NPC
 * - Ranked by total appearances across games
 */
const mostStorytold = computed<HighlightRole | null>(() =>
  resolveHighlight(
    (role) => role.type !== "FABLED" && role.type !== "LORIC",
    (usage) => usage.total
  )
);

/**
 * Favorite bluff:
 * - Any role with at least 1 bluff
 * - Ranked by bluff count
 */
const favoriteBluff = computed<HighlightRole | null>(() =>
  resolveHighlight(
    (_role, usage) => usage.bluffs > 0,
    (usage) => usage.bluffs
  )
);

/**
 * Favorite NPC:
 * - FABLED or LORIC
 * - Ranked by npcUses (from game.fabled)
 */
const favoriteNpc = computed<HighlightRole | null>(() =>
  resolveHighlight(
    (role, usage) =>
      (role.type === "FABLED" || role.type === "LORIC") &&
      usage.npcUses > 0,
    (usage) => usage.npcUses
  )
);

/**
 * Return a link to a role detail page.
 */
function roleLink(id?: string) {
  if (!id) return "#";
  return `/roles/${id}`;
}

/**
 * Return "The " for most roles, but omit it for plural/group-style names
 * or names that already start with "The ".
 */
function roleArticle(name: string): "" | "The " {
  const pluralRoles = [
    "Legion", 
    "Lil' Monsta", 
    "Riot", 
  ];
  if (pluralRoles.includes(name)) return "";
  if (name.startsWith("The ")) return "";
  return "The ";
}
</script>
