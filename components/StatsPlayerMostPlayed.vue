<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Most played by type
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
      <div
        v-for="(roleCharacters, roleType) in topCharactersByRole"
        :key="roleType"
        class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col justify-center"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ getRoleLabel(roleType) }}
        </h3>

        <!-- Podium -->
        <div class="grid grid-cols-[minmax(0,_1.5rem)_2.5rem_2.5rem_minmax(0,_1.5rem)] grid-rows-[2.5rem_1.5rem_2rem] md:grid-cols-[minmax(0,_2rem)_3.5rem_3.5rem_minmax(0,_2rem)] md:grid-rows-[3.5rem_2rem_3rem] mx-auto">
          <!-- 1st: top middle -->
          <div v-if="roleCharacters[0]" class="relative mb-8 col-start-2 col-span-2 row-span-2 z-[1]">
            <nuxt-link 
              :to="roleLink(roleCharacters[0].name)"
            >
              <Token
                :character="{
                  role: {
                    name: roleCharacters[0].name,
                    token_url: roleCharacters[0].token_url,
                  },
                }"
                size="md"
                v-tooltip="`${roleCharacters[0].name} (${roleCharacters[0].count}×)`"
              />
            </nuxt-link>

            <span
              class="absolute left-1/2 -bottom-[4rem] md:-bottom-[4.5rem] -translate-x-1/2 z-20 text-xs leading-none flex items-center justify-center w-6 h-6 px-1 py-0.5 rounded-full text-white bg-stone-700"
            >
              {{ roleCharacters[0].count }}
            </span>
          </div>
          <div 
            v-else
            dir="rtl"
            class="relative col-end-5 row-start-3"
          >
            <Token
              :character="{
                  role: {
                    name: '',
                    token_url: '',
                  },
                }"
              size="md"
            />
          </div>

          <!-- 2nd: bottom left -->
          <div
            v-if="roleCharacters[1]"
            class="relative col-start-1 row-start-3"
          >
            <nuxt-link
              :to="roleLink(roleCharacters[1].name)"
            >
              <Token
                :character="{
                  role: {
                    name: roleCharacters[1].name,
                    token_url: roleCharacters[1].token_url,
                  },
                }"
                size="sm"
                v-tooltip="`${roleCharacters[1].name} (${roleCharacters[1].count}×)`"
              />
            </nuxt-link>

            <span
              class="absolute left-3 -bottom-2 z-20 text-xs leading-none flex items-center justify-center w-5 h-5 px-1 py-0.5 rounded-full text-white bg-stone-600"
            >
            <!-- <span 
              class="absolute -right-3 top-2/3 -translate-y-1/2 z-20 text-xs leading-none flex items-center justify-center w-5 h-5 px-1 py-0.5 rounded-full text-black bg-slate-300 border border-slate-500"
            > -->
              {{ roleCharacters[1].count }}
            </span>
          </div>
          <div 
            v-else
            dir="rtl"
            class="relative col-end-5 row-start-3"
          >
            <Token
              :character="{
                  role: {
                    name: '',
                    token_url: '',
                  },
                }"
              size="sm"
            />
          </div>

          <!-- 🥉 3rd place: bottom right -->
          <div
            v-if="roleCharacters[2]"
            dir="rtl"
            class="relative col-end-5 row-start-3"
          >
            <nuxt-link
              :to="roleLink(roleCharacters[2].name)"
            >
              <Token
                :character="{
                  role: {
                    name: roleCharacters[2].name,
                    token_url: roleCharacters[2].token_url,
                  },
                }"
                size="sm"
                v-tooltip="`${roleCharacters[2].name} (${roleCharacters[2].count}×)`"
              />
            </nuxt-link>
            <span 
              class="absolute right-3 -bottom-2 z-20 text-xs leading-none flex items-center justify-center w-5 h-5 px-1 py-0.5 rounded-full text-white bg-stone-500"
            >
              {{ roleCharacters[2].count }}
            </span>
          </div>
          <div 
            v-else
            dir="rtl"
            class="relative col-end-5 row-start-3"
          >
            <Token
              :character="{
                  role: {
                    name: '',
                    token_url: '',
                  },
                }"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Game, Character } from "@prisma/client";

type RoleType = string;

type CharacterStat = {
  name: string;
  count: number;
  token_url: string | null;
};

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  player_characters: (Character & {
    name: string | null;
    role?: { token_url: string; type: string };
    related_role?: { token_url: string };
  })[];
};

const props = defineProps<{
  games: GameWithChars[];
}>();

/**
 * Human-readable labels.
 */
const ROLE_LABELS: Record<string, string> = {
  TOWNSFOLK: "Townsfolk",
  OUTSIDER: "Outsiders",
  MINION: "Minions",
  DEMON: "Demons",
  TRAVELER: "Travellers",
};

/**
 * Return a readable label for a role type.
 */
function getRoleLabel(type: string): string {
  return ROLE_LABELS[type] ?? type;
}

/**
 * Return a link to a character's detail page.
 */

function roleLink(name?: string) {
  if (!name) return "#";
  return `/roles/${name.toLowerCase().replace(/ /g, "_")}`;
}

/**

 * Determine the top 3 most played characters per role type.
 *
 * All characters a player was in a game, excluding:
 * - Games flagged with `ignore_for_stats`
 * - Fabled roles
 */
const topCharactersByRole = computed<Record<RoleType, CharacterStat[]>>(() => {
  const allPlayedCharacters = props.games
    .filter((game) => !game.ignore_for_stats)
    .flatMap((game) => game.player_characters)
    .filter((character) => character.name);

  // Count per role type, per character name  
  const counts: Record<RoleType, Record<string, number>> = {};

  // Character tokens indexed by character name
  const tokenByName: Record<string, string | null> = {};

  for (const character of allPlayedCharacters) {
    if (!character.name) continue;
    if (
      character.role?.type === "FABLED" ||
      character.role?.type === "LORIC"
    ) continue;

    const roleType: RoleType = character.role?.type || "Unknown";

    const tokenUrl =
      character.role?.token_url ?? character.related_role?.token_url ?? null;

    if (!counts[roleType]) {
      counts[roleType] = {};
    }

    const roleCounts = counts[roleType];
    roleCounts[character.name] = (roleCounts[character.name] || 0) + 1;
    tokenByName[character.name] = tokenUrl;
  }

  const result: Record<RoleType, CharacterStat[]> = {};

  for (const [roleType, roleCounts] of Object.entries(counts)) {
    const topThree = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1]) // High to low
      .slice(0, 3) // Top 3 per role
      .map(([name, count]) => ({
        name,
        count,
        token_url: tokenByName[name] ?? null,
      }));

    result[roleType] = topThree;
  }

  return result;
});
</script>