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
              <!-- <div class="absolute -bottom-2 -right-2">
                <Token
                  v-if="item.token"
                  :character="{
                    name: item.token.name,
                    role: {
                      name: item.token.name,
                      token_url: item.token.token_url || '',
                      type: item.token.type || 'TOWNSFOLK',
                      initial_alignment: item.token.initial_alignment || 'GOOD',
                    },
                  }"
                  size="sm"
                  hide-name
                />
              </div> -->
            </div>

            <div class="text-center text-sm text-balance max-w-44">
              <span class="font-semibold">{{ item.player.username }}</span> has been {{ roleArticle(item.role) }}<span class="font-semibold">{{ item.role }}</span>
              {{ item.count }} time<span v-if="item.count !== 1">s</span>.
            </div>
          </template>
          <template v-else>
            <div class="text-stone-400 text-sm">Not enough data.</div>
          </template>

          <!-- <div v-if="item.games.length" class="text-xs text-stone-500 flex flex-wrap gap-2 justify-center">
            <NuxtLink
              v-for="gameId in item.games"
              :key="gameId"
              :to="`/game/${gameId}`"
              class="underline text-primary"
            >
              Game {{ gameId }}
            </NuxtLink>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from "vue";

type PlayerSummary = {
  user_id: string | null;
  username: string;
  avatar: string | null;
  priority?: number;
  plays: number;
  wins: number;
  losses: number;
  good_plays: number;
  evil_plays: number;
  drunk_plays: number;
  lunatic_plays: number;
  mutant_plays: number;
  damsel_plays: number;
  role_details: Record<
    string,
    { token_url: string | null; type: string | null; initial_alignment: string | null }
  >;
  role_tokens: Record<string, string | null>;
  role_games: Record<string, string[]>;
  roles: Record<string, number>;
};

const props = defineProps<{
  players: PlayerSummary[];
}>();

const NuxtLink = resolveComponent("nuxt-link");

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

function roleGames(player: PlayerSummary | null, role: string) {
  if (!player) return [];
  return player.role_games?.[role] ?? [];
}

function roleArticle(name: string): "" | "the " {
  const pluralRoles = ["Legion", "Lil' Monsta", "Riot"];
  if (pluralRoles.includes(name)) return "";
  if (name.startsWith("The ")) return "";
  return "the ";
}
</script>
