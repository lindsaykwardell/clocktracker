<template>
  <div class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-3">
    <h3 class="font-sorts text-center text-lg lg:text-xl">
      {{ title }}
    </h3>

    <div v-if="items.length === 0" class="text-center text-sm text-stone-400">
      No data available.
    </div>

    <ol v-else class="flex flex-col text-sm md:text-base divide-y divide-stone-400 dark:divide-stone-700/40">
      <li
        v-for="item in items"
        :key="item.username"
        class="flex items-center justify-between gap-2 py-1"
      >
        <div class="flex items-center gap-4">
          <Avatar
            :value="item.avatar || '/img/default.png'"
            size="xs"
            class="border-stone-800"
            background
          />

          <component
            v-if="item.user_id"
            :is="NuxtLink"
            :to="`/@${item.username}`"
            class="font-semibold hover:underline"
          >
            {{ item.username }}
          </component>
          <span v-else class="font-semibold">
            {{ item.username }}
          </span>
        </div>
        

        <span class="text-xs md:text-base text-stone-800 px-2 bg-stone-300 rounded-md leading-none">
          {{ item.count }}
        </span>
      </li>
    </ol>
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
  storyteller_plays: number;
};

const props = defineProps<{
  players: PlayerSummary[];
  mode: "players" | "storytellers";
  title: string;
}>();

const NuxtLink = resolveComponent("nuxt-link");

const items = computed(() => {
  const list = [...props.players];
  const field = props.mode === "players" ? "plays" : "storyteller_plays";
  return list
    .filter((p) => (p as any)[field] > 0)
    .sort((a, b) => {
      const diff = (b as any)[field] - (a as any)[field];
      if (diff !== 0) return diff;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
    .slice(0, 5)
    .map((p) => ({ ...p, count: (p as any)[field] as number }));
});
</script>
