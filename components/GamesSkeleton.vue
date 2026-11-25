<template>
  <!--
    Placeholder for the Games tab (UserGamesView) while the games load: the
    toolbar row (sort, order, filter and select on the left; count and
    Grid/Table on the right), the empty filter row, then tiles or table rows,
    whichever view the player last chose.
  -->
  <div role="status" aria-busy="true" aria-live="polite">
    <span class="sr-only">Loading games…</span>

    <div aria-hidden="true" class="w-full flex flex-col gap-4">
      <div class="flex flex-col lg:flex-row gap-3 px-8 lg:px-12">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="skeleton-block h-10 w-40 rounded" />
          <div class="skeleton-block h-10 w-32 rounded" />
          <div class="skeleton-block h-10 w-32 rounded-md" />
          <div class="skeleton-block h-10 w-28 rounded-md" />
        </div>
        <div class="flex-grow" />
        <div class="flex gap-2 items-center justify-end">
          <div class="skeleton-block h-6 w-24 rounded" />
          <div class="skeleton-block h-10 w-40 rounded-lg" />
        </div>
      </div>
      <!-- The (empty) row of active filters -->
      <div class="px-8 lg:px-12" />
      <div class="w-screen md:w-auto overflow-hidden">
        <GameTableSkeleton v-if="gameView === 'table'" />
        <GameTilesSkeleton v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";

// The same saved choice as UserGamesView. Read once mounted: the server can't
// see it, and reading it earlier would make hydration mismatch.
const gameView = useLocalStorage<"grid" | "table">("gameView", "grid", {
  initOnMounted: true,
});
</script>
