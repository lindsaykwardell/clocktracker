<template>
  <!--
    Placeholder for UserHeader while the player loads: same band, avatar size
    and tab row, so the real header drops into place without a jump. The
    shimmer is .skeleton-block in app.vue.
  -->
  <div class="bg-stone-200 dark:bg-stone-950 shadow-lg" aria-hidden="true">
    <div
      class="flex flex-col items-center md:items-start w-full lg:w-2/3 m-auto pt-4 px-8 lg:px-0 gap-4"
    >
      <div class="flex flex-col md:flex-row gap-4 md:gap-2 lg:gap-3 xl:gap-4 items-center w-full">
        <div class="skeleton-block w-32 md:w-40 h-32 md:h-40 rounded-full shrink-0" />
        <div class="flex-grow flex flex-col items-center md:items-start gap-2 w-full">
          <div class="skeleton-block h-8 w-64 max-w-full rounded" />
          <div class="skeleton-block h-4 w-40 rounded" />
          <div class="skeleton-block h-5 w-52 rounded" />
          <div class="flex gap-2">
            <div class="skeleton-block h-5 w-16 rounded" />
            <div class="skeleton-block h-5 w-16 rounded" />
          </div>
        </div>
      </div>
      <!-- Communities and bio: only on the Profile tab, like UserHeader. -->
      <template v-if="full">
        <div class="flex flex-col gap-1 items-center md:items-start">
          <div class="skeleton-block h-3 w-24 rounded" />
          <div class="flex gap-0.5">
            <div v-for="n in 6" :key="n" class="skeleton-block w-9 h-9 rounded-full" />
          </div>
        </div>
        <hr class="border-stone-100 dark:border-stone-600 w-full" />
        <div class="w-full max-w-[80ch] flex flex-col items-center md:items-start">
          <div v-for="line in bioLines" :key="line" class="h-6 w-full flex items-center">
            <div class="skeleton-block h-3.5 rounded" :class="line" />
          </div>
        </div>
      </template>
      <div class="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 py-2 md:py-0 md:pb-3">
        <div class="skeleton-block h-7 w-16 rounded" />
        <div class="skeleton-block h-7 w-16 rounded" />
        <div class="skeleton-block h-7 w-28 rounded" />
        <div class="skeleton-block h-7 w-14 rounded" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ full?: boolean }>(), { full: false });
const bioLines = ["w-full", "w-11/12", "w-full", "w-2/3"];
</script>
