<template>
  <!--
    Placeholder for the Stats tab while the games load: the same spacing,
    widths and grids as the real sections (UserCharts, PlayerHighlights,
    PlayerMostPlayed), so nothing jumps when the data arrives. The toolbar
    above it is the real one (UserCharts shows it while loading). Text lines sit
    in boxes of the real line height. The shimmer is .skeleton-block in app.vue.
  -->
  <div role="status" aria-busy="true" aria-live="polite">
    <span class="sr-only">Loading stats…</span>

    <div aria-hidden="true" class="space-y-8 md:space-y-12 xl:space-y-16">
      <!-- Highlights -->
      <section class="w-full xl:w-3/4 xl:mx-auto">
        <div class="h-7 lg:h-8 flex justify-center items-center mb-2 lg:mb-4">
          <div class="skeleton-block h-5 lg:h-6 w-32 rounded" />
        </div>
        <!-- The four fixed highlights -->
        <div class="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="n in 4" :key="n" :class="cardClass">
            <div class="h-7 flex items-center">
              <div class="skeleton-block h-4 w-28 rounded" />
            </div>
            <div class="skeleton-block w-32 h-32 md:w-40 md:h-40 rounded-full" />
            <div :class="[textClass, mode === 'storyteller' ? 'pb-2' : '']">
              <div
                v-for="line in mode === 'storyteller' ? lines.slice(0, 2) : lines"
                :key="line"
                class="h-5 w-full flex items-center"
              >
                <div class="skeleton-block h-3 mx-auto rounded" :class="line" />
              </div>
            </div>
          </div>
        </div>

        <!-- The highlighted stat cards and the All Cards button (Player view only) -->
        <div v-if="mode === 'player'" class="mt-4 flex flex-col items-center gap-6">
          <div class="w-full grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div v-for="n in 4" :key="n" :class="[cardClass, 'pt-6']">
              <div class="h-7 flex items-center">
                <div class="skeleton-block h-4 w-32 rounded" />
              </div>
              <div class="skeleton-block w-32 h-32 md:w-40 md:h-40 rounded-full" />
              <div :class="textClass">
                <div v-for="line in lines" :key="line" class="h-5 w-full flex items-center">
                  <div class="skeleton-block h-3 mx-auto rounded" :class="line" />
                </div>
              </div>
            </div>
          </div>
          <div class="skeleton-block h-8 w-24 rounded-md" />
        </div>
      </section>

      <!-- Most played (Player view) -->
      <section v-if="mode === 'player'" class="w-full xl:w-3/4 xl:mx-auto">
        <div class="h-7 lg:h-8 flex justify-center items-center mb-1 lg:mb-2">
          <div class="skeleton-block h-5 lg:h-6 w-36 rounded" />
        </div>
        <div class="h-6 flex justify-center items-center mb-2 lg:mb-4">
          <div class="skeleton-block h-3 w-72 max-w-full rounded" />
        </div>
        <div class="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="n in 5"
            :key="n"
            class="p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col items-center gap-3"
          >
            <div class="h-6 flex items-center">
              <div class="skeleton-block h-4 w-24 rounded" />
            </div>
            <div class="skeleton-block w-24 h-24 md:w-28 md:h-28 rounded-full" />
          </div>
        </div>
      </section>
      <!-- Game Size and Scripts Storytold (Storyteller view) -->
      <section
        v-if="mode === 'storyteller'"
        class="w-full xl:w-3/4 xl:mx-auto grid grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-4"
      >
        <div class="col-span-4 lg:col-span-2">
          <div class="h-7 lg:h-8 flex justify-center items-center mb-2 lg:mb-4">
            <div class="skeleton-block h-5 lg:h-6 w-28 rounded" />
          </div>
          <div class="skeleton-block h-64 rounded-lg" />
        </div>
        <div class="col-span-4 lg:col-span-3 mt-8 lg:mt-0">
          <div class="h-7 lg:h-8 flex justify-center items-center mb-2 lg:mb-4">
            <div class="skeleton-block h-5 lg:h-6 w-40 rounded" />
          </div>
          <div class="skeleton-block h-64 rounded-lg" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ mode?: "player" | "storyteller" }>(), { mode: "player" });

// Shared by both rows of cards; four lines of text, like the longest real ones.
const cardClass =
  "p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col items-center gap-2 md:gap-3";
const textClass = "w-full max-w-56 flex flex-col items-center";
const lines = ["w-full", "w-5/6", "w-full", "w-1/2"];
</script>
