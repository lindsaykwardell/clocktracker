<template>
  <div class="ct-card ct-card--role flex flex-col md:flex-row gap-4 items-center md:items-top">
    <Token :character="character" size="lg" />

    <div class="flex-grow flex flex-col items-center md:items-start gap-2">
      <div class="ct-card__header">
        <h2 class="ct-card__title text-center md:text-start">
          <nuxt-link
            :to="`/roles/${role.id}`"
            class="overlay-link"
          >
            {{ role.name }}
          </nuxt-link>
        </h2>

        <p class="ct-card__subline text-center md:text-start">
          {{ roleType }}
        </p>
      </div>

      <p class="whitespace-pre-wrap text-center md:text-start w-full max-w-[80ch]">
        {{ role.ability }}
      </p>

      <section class="ct-card__tags">
        <div>
          <Badge color="scripts" size="sm">
            {{ role._count.scripts }} 
          </Badge>
          Script{{ role._count.scripts === 1 ? "" : "s" }}
        </div>
        <div>
          <Badge color="games" size="sm">
            {{ role._count.games }} 
          </Badge>
          Game{{ role._count.games === 1 ? "" : "s" }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Role } from "@prisma/client";
const props = defineProps<{
  role: Role & { _count: { scripts: number; games: number } };
}>();

const character = computed(() => ({
  alignment: props.role.initial_alignment,
  name: props.role.name,
  role: props.role,
}));

const roleType = computed(() => {
  const type = props.role.type ?? "";
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
});
</script>

<style scoped>
  .overlay-link::after {
    content: "";
    inset: 0;
    position: absolute;

    @apply transition duration-150 rounded border border-transparent hover:border-purple-700;
  }
</style>
