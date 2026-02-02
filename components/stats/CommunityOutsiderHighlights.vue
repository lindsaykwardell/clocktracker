<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-sorts text-center text-xl lg:text-2xl">
      The Usual Outsiders
    </h2>

    <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="item in roleItems"
        :key="item.role"
        class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-2 md:gap-3 items-center text-center"
      >
        <h3 class="font-sorts text-center text-lg lg:text-xl">
          {{ item.title }}
        </h3>

        <div class="flex flex-col items-center gap-4">
          <template v-if="item.player">
            <div class="relative">
              <Avatar
                :value="item.player?.avatar || '/img/default.png'"
                size="lg-token"
                class="border-stone-800"
                background
              />
              <div
                v-if="!item.player?.user_id"
                class="absolute top-0 left-0 w-full h-full bg-neutral-200/75 dark:bg-stone-800/75 rounded-full z-10"
              />
            </div>
            <div class="text-center text-sm text-balance max-w-44">
              <RedactedName
                class="font-semibold"
                :name="displayName(item.player)"
                :redact="props.anonymizeNonUsers && !item.player.user_id"
              />
              has been {{ roleArticle(item.role) }}<span class="font-semibold">{{ item.role }}</span>
              {{ item.count }} time<span v-if="item.count !== 1">s</span>.
            </div>
          </template>
          <template v-else>
            <div
              class="rounded-full shadow-lg w-36 h-36 md:w-48 md:h-48 aspect-square bg-stone-200 dark:bg-stone-800 border border-stone-400"
            />
            <div class="text-center text-stone-400 text-sm text-balance max-w-44">No plays recorded for this character.</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlayerSummary } from "~/composables/useCommunityStats";

const props = defineProps<{
  players: PlayerSummary[];
  anonymizeNonUsers?: boolean;
}>();

const displayName = (player: PlayerSummary) =>
  player.display_name || player.username;

/**
 * Build highlight items for each tracked outsider role.
 */
const roleItems = computed(() => {
  const makeItem = (
    role: string,
    title: string,
    field: keyof PlayerSummary
  ) => {
    const player = pickTop(role, field);
    const count = player ? (player[field] as number) ?? 0 : 0;
    const games = player ? roleGames(player, role) : [];
    const token = player?.role_details?.[role]
      ? {
          name: role,
          token_url: player.role_details[role].token_url,
          type: player.role_details[role].type,
          initial_alignment: player.role_details[role].initial_alignment,
        }
      : null;
    return {
      role,
      title,
      player,
      count,
      games,
      token,
    };
  };

  return [
    makeItem("Drunk", "The Drunk", "drunk_plays"),
    makeItem("Lunatic", "The Lunatic", "lunatic_plays"),
    makeItem("Mutant", "The Mutant", "mutant_plays"),
    makeItem("Damsel", "The Damsel", "damsel_plays"),
  ];
});


/**
 * Pick the top player for a given role field, breaking ties by priority.
 */
function pickTop(role: string, field: keyof PlayerSummary) {
  if (!props.players?.length) return null;
  return (
    props.players
      .filter((p) => ((p[field] as number) ?? 0) > 0 && role in p.role_games)
      .sort((a, b) => {
        const diff = (b[field] as number) - (a[field] as number);
        if (diff !== 0) return diff;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })[0] ?? null
  );
}

/**
 * Games where this player played the given role.
 */
function roleGames(player: PlayerSummary | null, role: string) {
  if (!player) return [];
  return player.role_games?.[role] ?? [];
}

/**
 * Return "the " for most roles, but omit it for plural/group names or names starting with "The ".
 */
function roleArticle(name: string): "" | "the " {
  const pluralRoles = ["Legion", "Lil' Monsta", "Riot"];
  if (pluralRoles.includes(name)) return "";
  if (name.startsWith("The ")) return "";
  return "the ";
}
</script>
