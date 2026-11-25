<template>
  <!--
    Placeholder for GameOverviewList (the Table view): the header row, then
    rows of the same height and spacing, with the columns in about the same
    proportions (Community from lg, Date/Location/Players from md). The
    shimmer is .skeleton-block in app.vue.
  -->
  <div class="mx-3 md:mx-4 flex flex-col gap-1 pb-1" aria-hidden="true">
    <div :class="[columns, 'h-[26px] items-center']">
      <div />
      <div class="flex justify-center"><div class="skeleton-block h-3 w-8 rounded" /></div>
      <div class="hidden md:flex justify-center"><div class="skeleton-block h-3 w-10 rounded" /></div>
      <div class="px-1 md:px-2"><div class="skeleton-block h-3 w-12 rounded" /></div>
      <div class="hidden md:block px-2"><div class="skeleton-block h-3 w-16 rounded" /></div>
      <div class="hidden lg:block px-2"><div class="skeleton-block h-3 w-20 rounded" /></div>
      <div class="hidden md:flex justify-center"><div class="skeleton-block h-3 w-32 rounded" /></div>
      <div class="flex justify-center"><div class="skeleton-block h-3 w-12 rounded" /></div>
      <div class="flex justify-center"><div class="skeleton-block h-3 w-14 rounded" /></div>
    </div>
    <div
      v-for="n in count"
      :key="n"
      :class="[columns, 'h-12 md:h-16 items-center rounded-lg md:rounded-2xl bg-stone-300/40 dark:bg-stone-900/60']"
    >
      <div />
      <div class="flex justify-center">
        <div class="skeleton-block w-8 h-8 md:w-12 md:h-12 rounded-full" />
      </div>
      <div class="hidden md:flex justify-center"><div class="skeleton-block h-4 w-20 rounded" /></div>
      <div class="px-1 md:px-2"><div class="skeleton-block h-4 rounded" :class="scriptWidths[n % scriptWidths.length]" /></div>
      <div class="hidden md:block px-2"><div class="skeleton-block h-4 w-14 rounded" /></div>
      <div class="hidden lg:block px-2" />
      <div class="hidden md:flex justify-center"><div class="skeleton-block h-4 w-6 rounded" /></div>
      <div class="flex justify-center"><div class="skeleton-block w-6 h-6 rounded-full" /></div>
      <div class="flex justify-center"><div class="skeleton-block w-8 h-8 rounded-full" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 20 });

// The table's own column widths, measured at full width.
const columns =
  "grid grid-cols-[1rem_2.5rem_1fr_3rem_3rem] md:grid-cols-[1.5rem_5rem_9fr_32fr_7fr_13fr_6fr_6fr] lg:grid-cols-[1.5rem_5rem_9fr_32fr_7fr_22fr_13fr_6fr_6fr]";
const scriptWidths = ["w-32", "w-44", "w-28", "w-56", "w-36"];
</script>
