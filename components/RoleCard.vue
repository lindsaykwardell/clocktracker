<template>
  <nuxt-link
    :to="`/roles/${role.id}`"
    class="bg-stone-300 dark:bg-stone-950 hover:bg-stone-200 dark:hover:bg-stone-900 w-full p-2 shadow-lg flex items-center"
  >
    <div class="flex flex-col md:flex-row gap-3 items-top">
      <Token :character="character" size="lg" />
      <div class="flex-grow flex flex-col gap-2">
        <h2 class="font-dumbledor text-xl lg:text-2xl">
          {{ role.name }}
        </h2>

        <section class="flex gap-6 text-stone-600">
          <div>
            <span
              class="text-stone-200 bg-purple-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ role._count.scripts }}
            </span>
            <span> Script{{ role._count.scripts === 1 ? "" : "s" }} </span>
          </div>
          <div>
            <span
              class="text-stone-200 bg-blue-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ role._count.games }}
            </span>
            <span> Game{{ role._count.games === 1 ? "" : "s" }} Played</span>
          </div>
        </section>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import type { Role } from "@prisma/client";
const props = defineProps<{
  role: Role & { _count: { scripts: number; games: number } };
}>();

const character = computed(() => ({
  alignment:
    props.role.type === "TRAVELER" ? "NEUTRAL" : props.role.initial_alignment,
  name: props.role.name,
  role: props.role,
}));
</script>
