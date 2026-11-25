<template>
  <!--
    Placeholder for GameOverviewGrid: the same auto-fill grid and tile size,
    each tile with its main token, date and title bar. The shimmer is
    .skeleton-block in app.vue.
  -->
  <ul
    class="grid gap-px bg-stone-300/30 dark:bg-stone-700/30 grid-cols-[repeat(auto-fill,_minmax(260px,_1fr))] md:grid-cols-[repeat(auto-fill,_minmax(360px,_1fr))]"
    aria-hidden="true"
  >
    <li
      v-for="n in count"
      :key="n"
      class="relative h-[290px] flex flex-col items-center justify-center gap-4 bg-stone-300/40 dark:bg-stone-900/60"
    >
      <div class="absolute top-2 left-2 skeleton-block h-4 w-20 rounded" />
      <div class="skeleton-block w-32 h-32 md:w-36 md:h-36 rounded-full" />
      <div class="absolute bottom-0 inset-x-0 h-9 px-2 flex items-center">
        <div class="skeleton-block h-4 w-40 rounded" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 30 });
</script>
