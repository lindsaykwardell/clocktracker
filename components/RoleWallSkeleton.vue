<template>
  <!--
    Placeholder for a character wall (StatsPlayerRoles / StatsStorytellerRoles)
    while the roles load: the same group columns, headings and token size. The
    shimmer is .skeleton-block in app.vue.
  -->
  <div
    class="grid gap-3"
    :class="storyteller ? 'lg:grid-cols-7' : 'lg:grid-cols-6'"
    aria-hidden="true"
  >
    <div
      v-for="group in groups"
      :key="group.name"
      :class="group.name === 'Townsfolk' ? 'lg:col-span-2' : 'col-span-1'"
    >
      <div class="h-7 flex justify-center items-center mb-2 md:mb-3">
        <div class="skeleton-block h-5 w-24 rounded" />
      </div>
      <div class="flex flex-wrap justify-center gap-1">
        <div
          v-for="n in group.count"
          :key="n"
          class="skeleton-block w-8 h-8 md:w-12 md:h-12 rounded-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ storyteller?: boolean }>();

// Roughly the size of each group, so the wall takes about the same room.
const groups = computed(() => [
  { name: "Townsfolk", count: 69 },
  { name: "Outsiders", count: 23 },
  { name: "Minions", count: 27 },
  { name: "Demons", count: 19 },
  { name: "Travelers", count: 18 },
  ...(props.storyteller ? [{ name: "NPCs", count: 25 }] : []),
]);
</script>
