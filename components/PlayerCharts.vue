<template>
  <div
    class="flex flex-col md:flex-row flex-wrap items-center space-around gap-4 justify-center"
  >
    <Alignment class="w-full md:w-1/4" :games="games" />
    <WinRate class="w-full md:w-1/4" :games="games" />
  </div>
</template>

<script setup lang="ts">
import { Game } from "composables/useGames";

defineProps<{
  games: Game[];
}>();
</script>
