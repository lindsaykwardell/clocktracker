<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Bag Composition Insights
    </h2>

    <div v-if="!scriptBags.length" class="text-center">
      No games recorded with a script.
    </div>

    <div v-else class="space-y-4 lg:space-y-8">
      <section
        v-for="bag in scriptBags"
        :key="bag.scriptName"
        class="relative border border-black bg-cover bg-center pb-12 script-bg"
        :style="
          bag.background
            ? { backgroundImage: `url(${bag.background})` }
            : {}
        "
        :class="{
          'is-trouble-brewing': bag.scriptName === 'Trouble Brewing',
          'is-sects-and-violets': bag.scriptName === 'Sects and Violets',
          'is-bad-moon-rising': bag.scriptName === 'Bad Moon Rising',
          'is-custom-script':
            [
              'Trouble Brewing',
              'Sects and Violets',
              'Bad Moon Rising',
            ].indexOf(bag.scriptName) === -1 &&
            !bag.background,
        }"
      >
        <h3 class="absolute bottom-0 font-sorts text-xl text-white text-center bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-2 w-full">
          {{ bag.scriptName }}
        </h3>

        <div class="grid gap-3 p-4 grid-cols-4 lg:grid-cols-8">
          <template v-for="group in bag.groups" :key="group.name">
            <div
              v-if="group.colSpan && group.colSpan > 0"
              :class="[
                'col-span-2 lg:col-span-1',
                {
                  'lg:col-span-2': group.colSpan === 2,
                  'lg:col-span-3': group.colSpan === 3,
                },
              ]"
            >
              <h4 class="text-white font-sorts text-lg font-medium text-center mb-1 lg:mb-2">
                {{ group.name }}
              </h4>

              <ul class="flex flex-wrap justify-center gap-2">
                <li v-for="role in group.roles" :key="role.id">
                  <nuxt-link :to="roleLink(role.id)">
                    <div class="relative pb-3">
                      <div
                        v-if="role.count === 0"
                        class="absolute top-0 left-0 bg-stone-800/75 rounded-full aspect-square w-full z-10"
                        v-tooltip="{
                          content: roleTooltip(role),
                          html: true
                        }"
                      />
                      <Token
                        :character="{
                          role: role,
                          alignment: role.initial_alignment,
                        }"
                        size="sm"
                        v-tooltip="{
                          content: roleTooltip(role),
                          html: true
                        }"
                      />
                      <span
                        v-if="role.count"
                        class="absolute z-[21] bottom-0 text-xs leading-none flex items-center justify-center w-4 md:w-5 h-4 md:h-5 md:px-1 py-0.5 rounded-full text-white bg-black"
                        :class="{
                          'left-0 md:left-1': role.bluffCount,
                          'left-1/2 -translate-x-1/2': !role.bluffCount,
                        }"
                      >
                        {{ role.count }}
                      </span>
                      <span
                        v-if="role.bluffCount"
                        class="absolute bottom-0 z-20 text-xs leading-none flex items-center justify-center w-4 md:w-5 h-4 md:h-5 md:px-1 py-0.5 rounded-full text-black bg-red-800"
                        :class="{
                          'right-0 md:right-1': role.count,
                          'left-1/2 -translate-x-1/2': !role.count,
                        }"
                      >
                        {{ role.bluffCount }}
                      </span>
                    </div>
                  </nuxt-link>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Alignment } from "@prisma/client";
import type { RoleType } from "~/composables/useRoles";
import type { GameRecord } from "~/composables/useGames";
import { filterStorytellerGames } from "~/composables/useGames";

const rolesStore = useRoles();

const props = defineProps<{
  games: GameRecord[];
  username: string;
  condensed?: boolean;
}>();

type ScriptRole = {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: Alignment;
};

type ScriptRoleWithCount = ScriptRole & {
  count: number;
  bluffCount: number;
};

type ScriptBagGroup = {
  name: string;
  roles: ScriptRoleWithCount[];
  colSpan?: number;
};

type ScriptBag = {
  scriptName: string;
  background?: string | null;
  groups: ScriptBagGroup[];
};

type ScriptMeta = {
  scriptName: string;
  scriptId: number | null;
  rolesFromGame?: ScriptRole[];
  background?: string | null;
  playCount: number;
};

type AssociatedScript = {
  background?: string | null;
  roles?: ScriptRole[];
} | null;

type StorytellerGameRecord = GameRecord & {
  script_id?: number | null;
  associated_script?: AssociatedScript;
};

/**
 * Storyteller games for this user.
 */
const storytellerGames = computed<StorytellerGameRecord[]>(() =>
  filterStorytellerGames(props.games, props.username) as StorytellerGameRecord[]
);

/**
 * Unique scripts (per name) and their metadata, sorted by play count.
 */
const scripts = computed<ScriptMeta[]>(() => {
  const map = new Map<string, ScriptMeta>();

  for (const game of storytellerGames.value) {
    const scriptNameRaw = (game.script ?? "").trim();

    // Ignore games with no script
    if (!scriptNameRaw) continue;

    const scriptName = scriptNameRaw;
    const scriptId = game.script_id ?? null;
    const associatedScript = game.associated_script;
    const rolesFromGame = associatedScript?.roles as ScriptRole[] | undefined;
    const background = associatedScript?.background ?? null;

    if (!map.has(scriptName)) {
      map.set(scriptName, { 
        scriptName, 
        scriptId, 
        rolesFromGame, 
        background, 
        playCount: 1,
      });
    } 
    else {
      const existing = map.get(scriptName)!;
      existing.playCount++;

      if (!existing.rolesFromGame && rolesFromGame?.length) {
        existing.rolesFromGame = rolesFromGame;
      }

      if (!existing.background && background) {
        existing.background = background;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.playCount - a.playCount);
});

/**
 * Collect all role IDs that were actually used for a given script
 * (bag tokens, bluffs, and fabled).
 */
function getUsedRoleIdsForScript(scriptName: string): Set<string> {
  const ids = new Set<string>();

  for (const game of storytellerGames.value) {
    if (game.script !== scriptName) continue;

    // Page 1 bag tokens
    const firstPage = game.grimoire?.[0];
    firstPage?.tokens?.forEach((token: any) => {
      if (token.role_id) {
        ids.add(token.role_id);
      }
    });

    // Demon bluffs
    game.demon_bluffs?.forEach((bluff: any) => {
      if (bluff.role_id) {
        ids.add(bluff.role_id);
      }
    });

    // Fabled used
    game.fabled?.forEach((fabled: any) => {
      if (fabled.role_id) {
        ids.add(fabled.role_id);
      }
    });
  }

  return ids;
}

/**
 * Per-script role lists, populated by `loadScriptRoles`.
 *
 * For each script, this holds the roles defined on the script, plus
 * any Travelers / NPC roles that were used but not listed.
 */
const scriptRoles = ref<Record<string, ScriptRole[]>>({});

/**
 * Populate `scriptRoles`:
 * - Prefer roles from associated_script on the game when available.
 * - Otherwise fetch roles via /api/script/:id.
 * - As a fallback, use all roles from the global store.
 * - Always add used Travelers / NPC that aren't on the script.
 */
async function loadScriptRoles() {
  const result: Record<string, ScriptRole[]> = {};

  // Ensure global roles are loaded for fallback and extra-role lookup.
  await rolesStore.fetchRoles();
  const allRoles = rolesStore.getAllRoles();

  for (const { scriptName, scriptId, rolesFromGame } of scripts.value) {
    try {
      let rolesForScript: ScriptRole[];

      if (rolesFromGame && rolesFromGame.length) {
        rolesForScript = [...rolesFromGame];
      } 
      else if (scriptId) {
        const data = await $fetch<{
          background?: string;
          roles: ScriptRole[];
        }>(`/api/script/${scriptId}`);

        rolesForScript = [...(data.roles ?? [])];
      } 
      else {
        // Fallback to all roles if we have no script definition.
        rolesForScript = [...allRoles];
      }

      // Add Travelers / NPC roles that were used but are not defined on the script.
      const usedIds = getUsedRoleIdsForScript(scriptName);
      const existingIds = new Set(rolesForScript.map((r) => r.id));

      for (const usedId of usedIds) {
        if (existingIds.has(usedId)) continue;

        const extra = allRoles.find((r) => r.id === usedId);
        if (!extra) continue;

        if (
          extra.type === "TRAVELER" ||
          extra.type === "FABLED" ||
          extra.type === "LORIC"
        ) {
          rolesForScript.push(extra);
          existingIds.add(extra.id);
        }
      }

      result[scriptName] = rolesForScript;
    } catch (e) {
      console.error("Failed to load roles for script", scriptName, e);
      result[scriptName] = [];
    }
  }

  scriptRoles.value = result;
}

watch(
  () => scripts.value,
  () => {
    if (scripts.value.length) {
      loadScriptRoles();
    }
  },
  { immediate: true }
);

/**
 * Count how many times a role appears in the bag, as a bluff,
 * and as a fabled role for a given script.
 */
function countUsesForRole(scriptName: string, roleId: string): {
  total: number;
  bluffs: number;
} {
  let total = 0;
  let bluffs = 0;

  for (const game of storytellerGames.value) {
    if (game.script !== scriptName) continue;

    const firstPage = game.grimoire?.[0];

    // Only roles that went into the bag (first page of grimoire).
    if (firstPage?.tokens) {
      for (const token of firstPage.tokens) {
        if (token.role_id === roleId) {
          total++;
        }
      }
    }

    // Bluffs
    for (const bluff of game.demon_bluffs ?? []) {
      if (bluff.role_id === roleId) {
        bluffs++;
      }
    }

    // Fabled on the game
    for (const fabled of game.fabled ?? []) {
      if (fabled.role_id === roleId) {
        total++;
      }
    }
  }

  return { total, bluffs };
}

/**
 * Some scripts (e.g. "Oops! All Outsiders") deviate heavily from
 * the 13/4/4/4 baseline. This function provides a default colSpan
 * for each group based on its size.
 */
function getBaseColSpanForGroup(group: ScriptBagGroup): number {
  const count = group.roles.length;

  // Travelers / NPCs always small.
  if (group.name === "Travelers" || group.name === "NPCs") {
    return 1;
  }

  if (count > 10) return 3; // Larger groups
  if (count > 6) return 2; // Medium groups
  return count > 0 ? 1 : 0; // Small or empty
}

/**
 * Normalize group colSpans so they fit in a single row up to `maxCols`.
 * If the sum exceeds maxCols, larger groups are shrunk first.
 */
function normalizeColSpans(
  groups: ScriptBagGroup[],
  maxCols = 8
): ScriptBagGroup[] {
  groups.forEach((g) => {
    g.colSpan = getBaseColSpanForGroup(g);
  });

  let total = groups.reduce((sum, g) => sum + (g.colSpan ?? 0), 0);

  if (total === 0) return groups;

  while (total > maxCols) {
    const candidate = groups
      .filter((g) => (g.colSpan ?? 0) > 1)
      .sort((a, b) => (b.colSpan ?? 0) - (a.colSpan ?? 0))[0];

    if (!candidate) {
      // Nothing left to shrink -> leave as-is.
      break;
    }

    candidate.colSpan = (candidate.colSpan ?? 1) - 1;
    total--;
  }

  return groups;
}

/**
 * Final data structure for template.
 * One "bag" per script, grouped by role type.
 */
const scriptBags = computed<ScriptBag[]>(() =>
  scripts.value.map(({ scriptName, background }) => {
    const rolesForScript = scriptRoles.value[scriptName] ?? [];

    const rolesWithCounts: ScriptRoleWithCount[] = rolesForScript.map(
      (role) => {
        const { total, bluffs } = countUsesForRole(scriptName, role.id);

        return {
          ...role,
          count: total,
          bluffCount: bluffs,
        };
      }
    );

    const byType = (type: RoleType) =>
      rolesWithCounts
        .filter((role) => role.type === type)
        .sort((a, b) => {
          if (a.count !== b.count) return b.count - a.count;
          if (a.bluffCount !== b.bluffCount) {
            return b.bluffCount - a.bluffCount;
          }
          return a.name.localeCompare(b.name);
        });

    const rawGroups: ScriptBagGroup[] = [
      { name: "Townsfolk", roles: byType("TOWNSFOLK" as RoleType) },
      { name: "Outsiders", roles: byType("OUTSIDER" as RoleType) },
      { name: "Minions", roles: byType("MINION" as RoleType) },
      { name: "Demons", roles: byType("DEMON" as RoleType) },
      { name: "Travelers", roles: byType("TRAVELER" as RoleType) },
      {
        name: "NPCs",
        roles: rolesWithCounts.filter(
          (role) => role.type === "FABLED" || role.type === "LORIC"
        ),
      },
    ];

    const groups = normalizeColSpans(rawGroups);

    return {
      scriptName,
      background,
      groups,
    };
  })
);

/**
 * Tooltip content for a role: shows bag count, bluffs, and/or usage.
 */
function roleTooltip(role: {
  name: string;
  type?: RoleType;
  count: number;
  bluffCount?: number;
}) {
  const bluff = role.bluffCount ?? 0;
  const lines: string[] = [`<strong>${role.name}</strong>`];

  // Travelers, Fabled, Loric don't go in the bag.
  const nonBagTypes = ["TRAVELER", "FABLED", "LORIC"];

  if (nonBagTypes.includes(role.type ?? "")) {
    if (role.count > 0) {
      lines.push(`Added: ${role.count}`);
    }

    return lines.join("<br>");
  }

  // Normal roles either go in the bag or are given as bluff.
  if (role.count > 0) {
    lines.push(`In bag: ${role.count}`);
  }

  if (bluff > 0) {
    lines.push(`<span class='text-red-400'>As bluff</span>: ${bluff}`);
  }

  if (lines.length === 1) {
    lines.push("Never used");
  }

  return lines.join("<br>");
}

/**
 * Return a link to a role detail page.
 */
function roleLink(id?: string) {
  if (!id) return "#";
  return `/roles/${id}`;
}
</script>

<style scoped>
.script-bg {
  --bg-gradient-color: rgba(0, 0, 0, 0.25);

  background-image: linear-gradient(var(--bg-gradient-color), var(--bg-gradient-color)),
    var(--bg-image-url);

  &.is-trouble-brewing {
    --bg-image-url: url("/img/trouble-brewing-bg.webp");
  }

  &.is-sects-and-violets {
    --bg-image-url: url("/img/sects-and-violets-bg.webp");
  }

  &.is-bad-moon-rising {
    --bg-image-url: url("/img/bad-moon-rising-bg.webp");
  }

  &.is-custom-script {
    --bg-image-url: url("/img/custom-script-bg.webp");
  }
}
</style>
