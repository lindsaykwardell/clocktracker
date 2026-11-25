<template>
  <!--
    Placeholder for the Profile tab (UserProfile) while the games load: the
    stats summary, the favourite games and the played characters, in the same
    sections and spacing. The shimmer is .skeleton-block in app.vue.
  -->
  <div role="status" aria-busy="true" aria-live="polite">
    <span class="sr-only">Loading profile…</span>

    <div aria-hidden="true" class="space-y-8 md:space-y-12 xl:space-y-16 pb-4 lg:pb-8">
      <!-- Stats summary (UserStatsSummary) -->
      <section class="px-4 lg:px-8 w-full xl:w-3/4 mx-auto">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="n in 4"
            :key="n"
            class="h-24 flex flex-col items-center justify-center gap-2 p-1 border rounded-lg dark:border-stone-700/50 bg-stone-200/30 dark:bg-stone-900/40"
          >
            <div class="skeleton-block h-8 w-16 rounded" />
            <div class="skeleton-block h-4 w-20 rounded" />
          </div>
        </div>
      </section>

      <!-- Favourite and latest games: the same whole-rows rule as the real ones -->
      <section>
        <div class="profile-games">
          <GameTilesSkeleton :count="10" />
        </div>
        <div v-if="showManage" class="flex justify-center items-center mt-2">
          <div class="skeleton-block h-8 w-44 rounded-md" />
        </div>
      </section>

      <!-- Played characters -->
      <section class="px-4 lg:px-8">
        <div class="h-7 lg:h-8 flex justify-center items-center mb-2 lg:mb-4">
          <div class="skeleton-block h-5 lg:h-6 w-44 rounded" />
        </div>
        <div class="flex flex-wrap justify-center gap-1 max-w-5xl mx-auto">
          <div v-for="n in 36" :key="n" class="skeleton-block w-12 h-12 rounded-full" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** The "Manage Favorite Games" button, on the player's own profile. */
  showManage?: boolean;
}>();
</script>
