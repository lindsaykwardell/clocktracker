<template>
  <!--
    Placeholder for the cards on the Statistic Cards page while the games and
    characters load: the first edition's logo and completion count, then
    horizontal cards in the same grid and size as RoleStatCard. The shimmer
    is .skeleton-block in app.vue.
  -->
  <div role="status" aria-busy="true" aria-live="polite">
    <span class="sr-only">Loading cards…</span>

    <div aria-hidden="true" class="space-y-4">
      <div class="flex flex-col items-center gap-4">
        <div class="skeleton-block w-64 max-w-full h-[276px] rounded-[40%]" />
        <div class="h-8 flex items-center">
          <div class="skeleton-block h-6 w-16 rounded" />
        </div>
      </div>
      <ul class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <li
          v-for="n in 12"
          :key="n"
          class="flex gap-3 items-center p-3 pr-8 rounded-lg border dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40"
        >
          <div class="skeleton-block shrink-0 w-[5.5rem] h-[5.5rem] rounded-full" />
          <div class="flex-1 flex flex-col gap-2">
            <div class="skeleton-block h-5 w-36 rounded" />
            <div class="skeleton-block h-4 rounded" :class="sentenceWidths[n % sentenceWidths.length]" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const sentenceWidths = ["w-3/4", "w-2/3", "w-5/6", "w-1/2"];
</script>
